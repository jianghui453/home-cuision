// pages/recipes/recipes.js
const app = getApp()

Page({
  data: {
    recipes: [],
    loading: true
  },

  onLoad: function() {
    this.loadRecipes()
  },

  onShow: function() {
    // 每次页面显示时重新加载数据，确保数据最新
    this.loadRecipes()
  },

  // 加载菜谱列表
  loadRecipes: function() {
    const db = wx.cloud.database()
    const that = this
    
    this.setData({ loading: true })
    
    db.collection('recipes')
      .where({
        _openid: app.globalData.openid || ''
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