// pages/order/order.js
const app = getApp()

Page({
  data: {
    diningRecords: [],
    loading: true,
    userInfo: null,
    showShareDialog: false,
    currentDiningId: null
  },

  onLoad: function(options) {
    // 获取用户信息
    this.getUserInfo()
    
    // 如果有dining_id参数，说明是从分享链接进入
    if (options.dining_id) {
      this.loadDiningRecord(options.dining_id)
    } else {
      // 加载所有点单记录
      this.loadDiningRecords()
    }
  },

  onShow: function() {
    // 每次页面显示时重新加载点单记录
    this.loadDiningRecords()
  },

  // 获取用户信息
  getUserInfo: function() {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo
      })
    }
  },

  // 加载所有点单记录
  loadDiningRecords: function() {
    const db = wx.cloud.database()
    const that = this
    
    this.setData({ loading: true })
    
    // 获取云函数上下文
    wx.cloud.callFunction({
      name: 'getOpenId',
      success: res => {
        const openid = res.result.openid
        
        // 查询用户参与的所有点单记录
        db.collection('dining_records')
          .orderBy('startTime', 'desc')
          .get()
          .then(res => {
            // 格式化时间
            const records = res.data.map(record => {
              if (record.startTime) {
                record.startTime = that.formatTime(record.startTime)
              }
              if (record.endTime) {
                record.endTime = that.formatTime(record.endTime)
              }
              // 计算点单中的菜品数量
              record.dishCount = record.orders ? record.orders.length : 0
              // 判断是否是创建者
              record.isOwner = record._openid === openid
              return record
            })
            
            that.setData({
              diningRecords: records,
              loading: false
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
      fail: err => {
        console.error('获取用户openid失败', err)
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        })
        that.setData({ loading: false })
      }
    })
  },

  // 加载单个点单记录
  loadDiningRecord: function(id) {
    const db = wx.cloud.database()
    const that = this
    
    db.collection('dining_records').doc(id).get()
      .then(res => {
        // 格式化时间
        const record = res.data
        if (record.startTime) {
          record.startTime = this.formatTime(record.startTime)
        }
        if (record.endTime) {
          record.endTime = this.formatTime(record.endTime)
        }
        
        // 设置全局点单记录
        app.globalData.currentDiningRecord = record
        
        // 跳转到点单详情页
        wx.redirectTo({
          url: '/pages/order/dining/dining'
        })
      })
      .catch(err => {
        console.error('加载点单记录失败', err)
        wx.showToast({
          title: '点单记录不存在或已结束',
          icon: 'none'
        })
      })
  },

  // 创建新的点单记录
  createDiningRecord: function() {
    const db = wx.cloud.database()
    const that = this
    
    wx.showLoading({
      title: '创建中...'
    })
    
    db.collection('dining_records').add({
      data: {
        startTime: db.serverDate(),
        endTime: null,
        status: 'active',
        orders: []
      }
    })
    .then(res => {
      wx.hideLoading()
      
      // 加载新创建的记录
      db.collection('dining_records').doc(res._id).get()
        .then(res => {
          const record = res.data
          if (record.startTime) {
            record.startTime = that.formatTime(record.startTime)
          }
          
          // 设置全局点单记录
          app.globalData.currentDiningRecord = record
          
          // 设置当前点单ID用于分享
          that.setData({
            currentDiningId: res._id,
            showShareDialog: true
          })
        })
    })
    .catch(err => {
      wx.hideLoading()
      console.error('创建点单记录失败', err)
      wx.showToast({
        title: '创建点单记录失败',
        icon: 'none'
      })
    })
  },

  // 查看点单详情
  viewDiningDetail: function(e) {
    const id = e.currentTarget.dataset.id
    const db = wx.cloud.database()
    const that = this
    
    db.collection('dining_records').doc(id).get()
      .then(res => {
        // 设置全局点单记录
        app.globalData.currentDiningRecord = res.data
        
        // 跳转到点单详情页
        wx.navigateTo({
          url: '/pages/order/dining/dining'
        })
      })
      .catch(err => {
        console.error('加载点单记录失败', err)
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        })
      })
  },

  // 开始新的点单
  startNewDining: function() {
    this.createDiningRecord()
  },

  // 隐藏分享对话框
  hideShareDialog: function() {
    this.setData({
      showShareDialog: false
    })
  },

  // 继续点单
  continueDining: function() {
    this.hideShareDialog()
    wx.navigateTo({
      url: '/pages/order/dining/dining'
    })
  },

  // 返回首页
  goToIndex: function() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  // 格式化时间
  formatTime: function(date) {
    if (!date) return ''
    
    date = new Date(date)
    
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    
    return `${year}/${month}/${day} ${hour}:${minute < 10 ? '0' + minute : minute}`
  },
  
  // 分享给好友
  onShareAppMessage: function() {
    if (this.data.currentDiningId) {
      return {
        title: '一起来点餐吧！',
        path: `/pages/order/order?dining_id=${this.data.currentDiningId}`,
        imageUrl: '/images/share-cover.png'
      }
    }
    return {
      title: '主厨私房菜',
      path: '/pages/index/index',
      imageUrl: '/images/share-cover.png'
    }
  },
})