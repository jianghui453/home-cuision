// pages/partners/partners.js
const app = getApp()

Page({
  data: {
    partners: [],
    loading: true,
    userInfo: null
  },

  onLoad: function() {
    // 获取用户信息
    this.getUserInfo()
    
    // 加载饭搭子列表
    this.loadPartners()
  },

  // 获取用户信息
  getUserInfo: function() {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo
      })
    }
  },

  // 加载饭搭子列表
  loadPartners: function() {
    const db = wx.cloud.database()
    const that = this
    
    this.setData({ loading: true })
    
    db.collection('partners')
      .where({
        _openid: wx.cloud.getWXContext().OPENID
      })
      .get()
      .then(res => {
        that.setData({
          partners: res.data,
          loading: false
        })
      })
      .catch(err => {
        console.error('加载饭搭子失败', err)
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        })
        that.setData({ loading: false })
      })
  },

  // 解除拉黑
  unblockPartner: function(e) {
    const id = e.currentTarget.dataset.id
    const db = wx.cloud.database()
    const that = this
    
    wx.showModal({
      title: '确认解除',
      content: '确定要解除拉黑吗？',
      success: res => {
        if (res.confirm) {
          db.collection('partners').doc(id).update({
            data: {
              isBlocked: false
            }
          })
          .then(() => {
            wx.showToast({
              title: '已解除拉黑'
            })
            
            // 刷新列表
            that.loadPartners()
          })
          .catch(err => {
            console.error('解除拉黑失败', err)
            wx.showToast({
              title: '操作失败，请重试',
              icon: 'none'
            })
          })
        }
      }
    })
  },

  // 删除饭搭子
  deletePartner: function(e) {
    const id = e.currentTarget.dataset.id
    const db = wx.cloud.database()
    const that = this
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该饭搭子吗？',
      success: res => {
        if (res.confirm) {
          db.collection('partners').doc(id).remove()
            .then(() => {
              wx.showToast({
                title: '删除成功'
              })
              
              // 刷新列表
              that.loadPartners()
            })
            .catch(err => {
              console.error('删除饭搭子失败', err)
              wx.showToast({
                title: '删除失败，请重试',
                icon: 'none'
              })
            })
        }
      }
    })
  },

  // 返回首页
  goToIndex: function() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})