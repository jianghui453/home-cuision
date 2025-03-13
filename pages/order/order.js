// pages/order/order.js
const app = getApp()

Page({
  data: {
    recipes: [],
    selectedDishes: [],
    loading: true,
    diningRecord: null,
    isBlocked: false,
    userInfo: null
  },

  onLoad: function(options) {
    // 获取用户信息
    this.getUserInfo()
    
    // 加载菜谱列表
    this.loadRecipes()
    
    // 如果有dining_id参数，说明是从分享链接进入
    if (options.dining_id) {
      this.loadDiningRecord(options.dining_id)
    } else {
      // 检查是否有当前进行中的点单记录
      this.checkCurrentDining()
    }
  },

  // 获取用户信息
  getUserInfo: function() {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo
      })
    }
  },

  // 加载菜谱列表
  loadRecipes: function() {
    const db = wx.cloud.database()
    const that = this
    
    this.setData({ loading: true })
    
    db.collection('recipes').get()
      .then(res => {
        that.setData({
          recipes: res.data,
          loading: false
        })
      })
      .catch(err => {
        console.error('加载菜谱失败', err)
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        })
        that.setData({ loading: false })
      })
  },

  // 检查当前是否有进行中的点单记录
  checkCurrentDining: function() {
    const currentDining = app.globalData.currentDiningRecord
    
    if (currentDining) {
      this.setData({
        diningRecord: currentDining
      })
    } else {
      // 创建新的点单记录
      this.createDiningRecord()
    }
  },

  // 加载点单记录
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
        
        that.setData({
          diningRecord: record
        })
        app.globalData.currentDiningRecord = record
        
        // 检查用户是否被拉黑
        that.checkIfBlocked()
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
    
    db.collection('dining_records').add({
      data: {
        startTime: db.serverDate(),
        endTime: null,
        status: 'active',
        orders: []
      }
    })
    .then(res => {
      // 加载新创建的记录
      db.collection('dining_records').doc(res._id).get()
        .then(res => {
          const record = res.data
          if (record.startTime) {
            record.startTime = that.formatTime(record.startTime)
          }
          
          that.setData({
            diningRecord: record
          })
          app.globalData.currentDiningRecord = record
        })
    })
    .catch(err => {
      console.error('创建点单记录失败', err)
      wx.showToast({
        title: '创建点单记录失败',
        icon: 'none'
      })
    })
  },

  // 检查用户是否被拉黑
  checkIfBlocked: function() {
    if (!this.data.userInfo || !this.data.diningRecord) return
    
    const db = wx.cloud.database()
    const that = this
    
    db.collection('partners')
      .where({
        _openid: this.data.diningRecord._openid,
        'userInfo.nickName': this.data.userInfo.nickName,
        isBlocked: true
      })
      .get()
      .then(res => {
        if (res.data.length > 0) {
          that.setData({
            isBlocked: true
          })
          wx.showModal({
            title: '提示',
            content: '很抱歉，您已被拉黑，无法参与点单',
            showCancel: false
          })
        }
      })
  },

  // 选择菜品
  selectDish: function(e) {
    if (this.data.isBlocked) {
      wx.showToast({
        title: '您已被拉黑，无法点单',
        icon: 'none'
      })
      return
    }
    
    const id = e.currentTarget.dataset.id
    const selectedDishes = this.data.selectedDishes
    
    const index = selectedDishes.indexOf(id)
    if (index > -1) {
      // 已选中，取消选择
      selectedDishes.splice(index, 1)
    } else {
      // 未选中，添加选择
      selectedDishes.push(id)
    }
    
    this.setData({
      selectedDishes: selectedDishes
    })
  },

  // 提交点单
  submitOrder: function() {
    if (this.data.isBlocked) {
      wx.showToast({
        title: '您已被拉黑，无法点单',
        icon: 'none'
      })
      return
    }
    
    if (this.data.selectedDishes.length === 0) {
      wx.showToast({
        title: '请至少选择一道菜',
        icon: 'none'
      })
      return
    }
    
    if (!this.data.diningRecord) {
      wx.showToast({
        title: '点单记录不存在',
        icon: 'none'
      })
      return
    }
    
    const db = wx.cloud.database()
    const that = this
    
    // 获取选中的菜品信息
    const selectedDishes = this.data.selectedDishes.map(id => {
      const dish = this.data.recipes.find(recipe => recipe._id === id)
      return {
        dishId: id,
        dishName: dish.dishName,
        orderTime: db.serverDate(),
        userName: this.data.userInfo ? this.data.userInfo.nickName : '匿名用户'
      }
    })
    
    // 显示加载提示
    wx.showLoading({
      title: '提交中...'
    })
    
    // 更新点单记录
    db.collection('dining_records').doc(this.data.diningRecord._id).update({
      data: {
        orders: db.command.push(selectedDishes)
      }
    })
    .then(() => {
      wx.hideLoading()
      wx.showToast({
        title: '点单成功'
      })
      
      // 更新饭搭子记录
      that.updatePartnerRecord()
      
      // 清空选择
      that.setData({
        selectedDishes: []
      })
      
      // 跳转到点单记录页
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/order/dining/dining'
        })
      }, 1500)
    })
    .catch(err => {
      wx.hideLoading()
      console.error('提交点单失败', err)
      wx.showToast({
        title: '提交失败，请重试',
        icon: 'none'
      })
    })
  },

  // 更新饭搭子记录
  updatePartnerRecord: function() {
    if (!this.data.userInfo || !this.data.diningRecord) return
    
    // 如果是自己创建的点单，不需要添加饭搭子记录
    if (this.data.diningRecord._openid === wx.cloud.getWXContext().OPENID) return
    
    const db = wx.cloud.database()
    
    // 查询是否已存在该饭搭子记录
    db.collection('partners')
      .where({
        _openid: wx.cloud.getWXContext().OPENID,
        'userInfo.nickName': this.data.diningRecord._openid
      })
      .get()
      .then(res => {
        if (res.data.length === 0) {
          // 不存在记录，添加新记录
          db.collection('partners').add({
            data: {
              userInfo: {
                nickName: this.data.diningRecord._openid,
                avatarUrl: '/images/default-avatar.png'
              },
              isBlocked: false,
              createTime: db.serverDate()
            }
          })
        }
      })
      
    // 检查是否已有记录
    db.collection('partners')
      .where({
        _openid: this.data.diningRecord._openid,
        'userInfo.nickName': this.data.userInfo.nickName
      })
      .get()
      .then(res => {
        if (res.data.length > 0) {
          // 已有记录，更新次数
          db.collection('partners').doc(res.data[0]._id).update({
            data: {
              partnerTimes: db.command.inc(1)
            }
          })
        } else {
          // 无记录，创建新记录
          db.collection('partners').add({
            data: {
              userInfo: this.data.userInfo,
              isBlocked: false,
              partnerTimes: 1
            }
          })
        }
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
    if (this.data.diningRecord) {
      return {
        title: '一起来点餐吧！',
        path: `/pages/order/order?dining_id=${this.data.diningRecord._id}`,
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