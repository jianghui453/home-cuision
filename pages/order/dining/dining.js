// pages/order/dining/dining.js
const app = getApp()

Page({
  data: {
    diningRecord: null,
    loading: true,
    userInfo: null,
    isOwner: false,
    shareDialogVisible: false
  },

  onLoad: function() {
    // 获取用户信息
    this.getUserInfo()
    
    // 加载当前点单记录
    this.loadCurrentDining()
  },

  // 获取用户信息
  getUserInfo: function() {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo
      })
    }
  },

  // 加载当前点单记录
  loadCurrentDining: function() {
    const currentDining = app.globalData.currentDiningRecord
    
    if (!currentDining) {
      wx.showToast({
        title: '没有进行中的点单',
        icon: 'none'
      })
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/index/index'
        })
      }, 1500)
      return
    }
    
    const db = wx.cloud.database()
    const that = this
    
    this.setData({ loading: true })
    
    db.collection('dining_records').doc(currentDining._id).get()
      .then(res => {
        that.setData({
          diningRecord: res.data,
          loading: false,
          isOwner: res.data._openid === wx.cloud.getWXContext().OPENID
        })
      })
      .catch(err => {
        console.error('加载点单记录失败', err)
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        })
        that.setData({ loading: false })
      })
  },

  // 结束点单
  endDining: function() {
    if (!this.data.isOwner) {
      wx.showToast({
        title: '只有创建者可以结束点单',
        icon: 'none'
      })
      return
    }
    
    wx.showModal({
      title: '确认结束',
      content: '确定要结束当前点单吗？',
      success: res => {
        if (res.confirm) {
          const db = wx.cloud.database()
          const that = this
          
          db.collection('dining_records').doc(this.data.diningRecord._id).update({
            data: {
              endTime: db.serverDate(),
              status: 'ended'
            }
          })
          .then(() => {
            wx.showToast({
              title: '点单已结束'
            })
            
            // 清除全局点单记录
            app.globalData.currentDiningRecord = null
            
            // 返回首页
            setTimeout(() => {
              wx.switchTab({
                url: '/pages/index/index'
              })
            }, 1500)
          })
          .catch(err => {
            console.error('结束点单失败', err)
            wx.showToast({
              title: '操作失败，请重试',
              icon: 'none'
            })
          })
        }
      }
    })
  },

  // 继续点单
  continueDining: function() {
    wx.redirectTo({
      url: '/pages/order/order'
    })
  },

  // 显示分享对话框
  showShareDialog: function() {
    this.setData({
      shareDialogVisible: true
    })
  },

  // 隐藏分享对话框
  hideShareDialog: function() {
    this.setData({
      shareDialogVisible: false
    })
  },

  // 拉黑用户
  blockUser: function(e) {
    if (!this.data.isOwner) {
      wx.showToast({
        title: '只有创建者可以拉黑用户',
        icon: 'none'
      })
      return
    }
    
    const userName = e.currentTarget.dataset.username
    
    wx.showModal({
      title: '确认拉黑',
      content: `确定要拉黑用户 ${userName} 吗？拉黑后该用户将无法参与您的点单。`,
      success: res => {
        if (res.confirm) {
          const db = wx.cloud.database()
          
          // 查找该用户记录
          db.collection('partners')
            .where({
              _openid: this.data.diningRecord._openid,
              'userInfo.nickName': userName
            })
            .get()
            .then(res => {
              if (res.data.length > 0) {
                // 更新拉黑状态
                db.collection('partners').doc(res.data[0]._id).update({
                  data: {
                    isBlocked: true
                  }
                })
                .then(() => {
                  wx.showToast({
                    title: '已拉黑该用户'
                  })
                })
              } else {
                wx.showToast({
                  title: '未找到该用户',
                  icon: 'none'
                })
              }
            })
        }
      }
    })
  },

  // 分享给好友
  onShareAppMessage: function() {
    return {
      title: '一起来点餐吧！',
      path: `/pages/order/order?dining_id=${this.data.diningRecord._id}`,
      imageUrl: '/images/share-cover.png'
    }
  },

  // 返回首页
  goToIndex: function() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})