// pages/recipes/recipes.js
const app = getApp()

Page({
  data: {
    recipes: [],
    loading: true,
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    isFirstLoad: true // 添加标记，用于判断是否是首次加载
  },

  onLoad: function() {
    // 检查用户是否已登录
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
      this.loadRecipesWithCache()
    } else if (this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
        this.loadRecipesWithCache()
      }
    }
  },

  onShow: function() {
    // 每次页面显示时检查是否有缓存数据
    if (this.data.hasUserInfo && !this.data.isFirstLoad) {
      // 非首次加载时，使用缓存数据
      const cachedRecipes = app.globalData.cachedRecipes || []
      if (cachedRecipes.length > 0) {
        this.setData({
          recipes: cachedRecipes,
          loading: false
        })
      }
    }
    // 标记非首次加载
    this.setData({
      isFirstLoad: false
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
      this.loadRecipesWithCache()
    }
  },

  // 带缓存的加载菜谱列表
  loadRecipesWithCache: function() {
    // 先检查是否有缓存数据
    const cachedRecipes = app.globalData.cachedRecipes || []
    
    if (cachedRecipes.length > 0) {
      // 有缓存数据，直接使用
      this.setData({
        recipes: cachedRecipes,
        loading: false
      })
    } else {
      // 无缓存数据，从数据库加载
      this.loadRecipes()
    }
  },

  // 从数据库加载菜谱列表
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
            // 更新数据并缓存
            const recipes = res.data
            app.globalData.cachedRecipes = recipes
            
            that.setData({
              recipes: recipes,
              loading: false
            })
            
            // 如果是下拉刷新，停止下拉刷新动画
            wx.stopPullDownRefresh()
          })
          .catch(err => {
            console.error('加载菜谱失败', err)
            // 新增错误处理逻辑，可根据实际情况调整
            wx.showModal({
              title: '错误提示',
              content: '加载菜谱失败，请检查网络或稍后重试。',
              showCancel: false
            })
            wx.showToast({
              title: '加载失败，请重试',
              icon: 'none'
            })
            that.setData({ loading: false })
            // 如果是下拉刷新，停止下拉刷新动画
            wx.stopPullDownRefresh()
          })
      },
      fail: err => {
        console.error('获取用户openid失败', err)
        // 新增错误处理逻辑，可根据实际情况调整
        wx.showModal({
          title: '错误提示',
          content: '获取用户openid失败，请检查网络或稍后重试。',
          showCancel: false
        })
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        })
        that.setData({ loading: false })
        // 如果是下拉刷新，停止下拉刷新动画
        wx.stopPullDownRefresh()
      }
    })
  },

  // 下拉刷新处理函数
  onPullDownRefresh: function() {
    // 下拉刷新时，强制从数据库重新加载数据
    if (this.data.hasUserInfo) {
      this.loadRecipes()
    } else {
      wx.stopPullDownRefresh()
    }
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
              // 删除成功后，更新缓存和页面数据
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