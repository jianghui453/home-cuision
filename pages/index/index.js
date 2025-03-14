// pages/index/index.js
// 获取应用实例
const app = getApp()

Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo')
  },

  onLoad: function() {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    }
  },

  // 跳转到我的菜谱页
  goToRecipes: function() {
    wx.switchTab({
      url: '/pages/recipes/recipes'
    })
  },

  // 跳转到点单页
  goToOrder: function() {
    wx.switchTab({
      url: '/pages/order/order'
    })
  },
  
  // 跳转到干饭记录页
  goToDiningRecords: function() {
    wx.switchTab({
      url: '/pages/order/order'
    })
  },
  
  // 跳转到饭搭子管理页
  goToPartners: function() {
    wx.switchTab({
      url: '/pages/partners/partners'
    })
  },

  // 获取用户信息
  getUserInfo: function(e) {
    if (e.detail.userInfo) {
      app.globalData.userInfo = e.detail.userInfo
      this.setData({
        userInfo: e.detail.userInfo,
        hasUserInfo: true
      })
    }
  }
})