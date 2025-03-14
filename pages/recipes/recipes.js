// pages/recipes/recipes.js
const app = getApp()

Page({
  data: {
    recipes: [],
    loading: true,
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo')
  },

  onLoad: function() {
    // 检查用户是否已登录
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
      this.loadRecipes()
    } else if (this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
        this.loadRecipes()
      }
    }
  },

  onShow: function() {
    // 每次页面显示时重新加载数据，确保数据最新
    if (this.data.hasUserInfo) {
      this.loadRecipes()
    }
  },

  // 获取用户信息
  getUserInfo: function(e) {
    if (e.detail.userInfo) {
      app.globalData.userInfo = e.detail.userInfo
      this.setData({
        userInfo: e.detail.userInfo,
        hasUserInfo: true
      })
      this.loadRecipes()
    }
  },

  // 加载菜谱列表
  loadRecipes: function() {
    const db = wx.cloud.database()
    const that = this
    
    this.setData({ loading: true })
    
    // 获取云函数上下文
    wx.cloud.callFunction({
      name: 'getOpenId',
      success: res => {
        const openid = res.result.openid
        app.globalData.openid = openid
        
        db.collection('recipes')
          .where({
            _openid: openid
          })
          .get()
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

  // 跳转到添加菜谱页
  goToAddRecipe: function() {
    wx.navigateTo({
      url: '/pages/recipes/add/add'
    })
  },

  // 跳转到菜谱详情页
  goToRecipeDetail: function(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/recipes/detail/detail?id=${id}`
    })
  },

  // 编辑菜谱
  editRecipe: function(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/recipes/add/add?id=${id}`
    })
  },

  // 删除菜谱
  deleteRecipe: function(e) {
    const id = e.currentTarget.dataset.id
    const that = this
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个菜谱吗？',
      success: function(res) {
        if (res.confirm) {
          const db = wx.cloud.database()
          db.collection('recipes').doc(id).remove()
            .then(() => {
              wx.showToast({
                title: '删除成功'
              })
              that.loadRecipes()
            })
            .catch(err => {
              console.error('删除失败', err)
              wx.showToast({
                title: '删除失败，请重试',
                icon: 'none'
              })
            })
        }
      }
    })
  }
})