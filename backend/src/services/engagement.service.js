class EngagementService {
  computeEngagementRate(views, likes, comments) {
    if (views === 0) return 0;
    return ((likes + comments) / views) * 100;
  }

  compareVideos(videoAStats, videoBStats) {
    const rateA = this.computeEngagementRate(
      videoAStats.views,
      videoAStats.likes,
      videoAStats.comments || 0
    );
    const rateB = this.computeEngagementRate(
      videoBStats.views,
      videoBStats.likes,
      videoBStats.comments || 0
    );

    return {
      videoA: {
        engagementRate: rateA.toFixed(2) + '%',
        views: videoAStats.views,
        likes: videoAStats.likes,
        comments: videoAStats.comments || 0,
      },
      videoB: {
        engagementRate: rateB.toFixed(2) + '%',
        views: videoBStats.views,
        likes: videoBStats.likes,
        comments: videoBStats.comments || 0,
      },
      winner: rateA > rateB ? 'A' : 'B',
      difference: Math.abs(rateA - rateB).toFixed(2) + '%',
    };
  }
}

export default new EngagementService();