from flask import Flask, request, jsonify
import yt_dlp
import json
import sys
import traceback

app = Flask(__name__)

def extract_video_id(url):
    """Extract YouTube video ID from URL"""
    try:
        if "watch?v=" in url:
            video_id = url.split("watch?v=")[1]
            if "&" in video_id:
                video_id = video_id.split("&")[0]
            return video_id if video_id else None
        
        if "youtu.be/" in url:
            video_id = url.split("youtu.be/")[1]
            if "?" in video_id:
                video_id = video_id.split("?")[0]
            return video_id if video_id else None
        
        return None
    except Exception as e:
        print(f"❌ Error extracting video ID: {e}")
        return None

def get_youtube_transcript_with_ytdlp(url):
    """Get transcript and metadata from YouTube using yt-dlp"""
    try:
        print(f"\n🎬 Processing YouTube: {url}")

        video_id = extract_video_id(url)
        if not video_id:
            return {"error": "Could not extract video ID from URL"}

        print(f"✅ Extracted video ID: {video_id}")

        # Get transcript and metadata using yt-dlp
        print("⏳ Fetching transcript and metadata with yt-dlp...")

        ydl_opts = {
            'quiet': False,
            'no_warnings': False,
            'writesubtitles': True,
            'writeautomaticsub': True,
            'subtitle_format': 'vtt',
            'skip_download': True,
        }

        transcript_text = ""
        metadata = {}

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:

                # Extract info FIRST
                info = ydl.extract_info(url, download=False)

                # Extract description & hashtags AFTER info exists
                description = info.get('description', '')

                hashtags = [
                    word
                    for word in description.split()
                    if word.startswith('#')
                ]

                metadata = {
                    "title": info.get('title', 'N/A'),
                    "channel": info.get('channel', 'N/A'),
                    "views": info.get('view_count', 0) or 0,
                    "likes": info.get('like_count', 0) or 0,
                    "duration": info.get('duration', 0) or 0,
                    "upload_date": info.get('upload_date', 'N/A'),
                    "description": description[:500],
                    "hashtags": hashtags[:10],
                    "url": url,
                    "video_id": video_id,
                }

                print(f"✅ Got metadata: {metadata['title']}")

                # Try automatic captions first
                if info.get('automatic_captions'):
                    print("⏳ Extracting automatic captions...")

                    for lang, captions in info.get('automatic_captions', {}).items():
                        for caption in captions:
                            try:
                                if caption.get('data'):
                                    lines = caption['data'].split('\n')

                                    for line in lines:
                                        if (
                                            line.strip()
                                            and '-->' not in line
                                            and not line.startswith('WEBVTT')
                                        ):
                                            transcript_text += line.strip() + " "

                                    if transcript_text:
                                        print(f"✅ Got automatic captions in {lang}")
                                        break
                            except:
                                pass

                        if transcript_text:
                            break

                # Fallback to manual subtitles
                if not transcript_text and info.get('subtitles'):
                    print("⏳ Extracting manual captions...")

                    for lang, captions in info.get('subtitles', {}).items():
                        for caption in captions:
                            try:
                                if caption.get('data'):
                                    lines = caption['data'].split('\n')

                                    for line in lines:
                                        if (
                                            line.strip()
                                            and '-->' not in line
                                            and not line.startswith('WEBVTT')
                                        ):
                                            transcript_text += line.strip() + " "

                                    if transcript_text:
                                        print(f"✅ Got manual captions in {lang}")
                                        break
                            except:
                                pass

                        if transcript_text:
                            break

                # Final fallback
                if not transcript_text:
                    print("⚠️ No captions found, using description instead")
                    transcript_text = description or "No transcript available"

                print(f"✅ Got transcript ({len(transcript_text)} chars)")

        except Exception as e:
            print(f"❌ yt-dlp error: {str(e)}")
            transcript_text = "No transcript available"

        return {
            "transcript": transcript_text if transcript_text else "No transcript available",
            "metadata": metadata,
            "status": "success"
        }

    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        traceback.print_exc()
        return {"error": f"Error: {str(e)}"}
def get_instagram_metadata(url, comments_estimate=100, likes_estimate=5000):
    """Get Instagram Reel info via yt-dlp"""
    try:
        print(f"\n📱 Processing Instagram: {url}")
        
        ydl_opts = {
            'quiet': False,
            'no_warnings': False,
            'skip_download': True,
        }
        
        print("⏳ Extracting Instagram info...")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            description = info.get('description', '')
            hashtags = [word for word in description.split() if word.startswith('#')]
            metadata = {
                "title": info.get('title', 'N/A'),
                "channel": info.get('uploader', 'N/A'),
                "hashtags": hashtags[:10], 
                "views": info.get('view_count', 0) or 0,
                "likes": info.get('like_count', 0) or likes_estimate,
                "comments": info.get('comment_count', 0) or comments_estimate,
                "duration": info.get('duration', 0) or 0,
                "upload_date": info.get('upload_date', 'N/A'),
                "url": url,
                "description": info.get('description', '')[:500],
            }
            
            # Try to extract transcript if available (captions)
            transcript = ""
            try:
                if info.get('automatic_captions'):
                    for lang, captions in info.get('automatic_captions', {}).items():
                        for caption in captions:
                            if caption.get('data'):
                                transcript += caption['data'] + " "
                        if transcript:
                            break
                
                if not transcript and info.get('subtitles'):
                    for lang, captions in info.get('subtitles', {}).items():
                        for caption in captions:
                            if caption.get('data'):
                                transcript += caption['data'] + " "
                        if transcript:
                            break
            except:
                pass
            
            # Fallback transcript
            if not transcript:
                transcript = info.get('description', 'No transcript available')
            
            print(f"✅ Got Instagram metadata: {metadata['title']}")
            
            return {
                "transcript": transcript if transcript else "No transcript available",
                "metadata": metadata,
                "status": "success"
            }
    
    except Exception as e:
        print(f"❌ Instagram error: {str(e)}")
        traceback.print_exc()
        return {"error": f"Error: {str(e)}"}

@app.route('/scrape-youtube', methods=['POST'])
def scrape_youtube():
    try:
        data = request.json
        url = data.get('url', '').strip()
        follower_count = data.get('follower_count', 0)
        
        if not url:
            return jsonify({"error": "URL is required"}), 400
        
        result = get_youtube_transcript_with_ytdlp(url)
        
        if 'metadata' in result and follower_count:
            result['metadata']['followers'] = follower_count
        
        return jsonify(result)
    
    except Exception as e:
        print(f"❌ Route error: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/scrape-instagram', methods=['POST'])
def scrape_instagram():
    try:
        data = request.json
        url = data.get('url', '').strip()
        follower_count = data.get('follower_count', 0)
        comments = data.get('comments', 100)
        likes = data.get('likes', 5000)
        
        if not url:
            return jsonify({"error": "URL is required"}), 400
        
        result = get_instagram_metadata(url, comments, likes)
        
        if 'metadata' in result and follower_count:
            result['metadata']['followers'] = follower_count
        
        return jsonify(result)
    
    except Exception as e:
        print(f"❌ Route error: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 Starting Flask Scraper Server (yt-dlp backend)")
    print("="*60)
    print("Running on http://localhost:5000")
    print("Press CTRL+C to stop\n")
    app.run(port=5000, debug=False)