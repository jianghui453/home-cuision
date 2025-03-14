// app.js
App({
  onLaunch: function() {
    // 初始化云开发环境
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloud1-3ge5o178a63ec946',
        traceUser: true
      })
    }
    
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: res => {
              this.globalData.userInfo = res.userInfo
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })
  },
  
  globalData: {
    userInfo: null,
    currentDiningRecord: null
  }
})