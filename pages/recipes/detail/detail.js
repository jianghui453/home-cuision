// pages/recipes/detail/detail.js
const app = getApp()

Page({
  data: {
    recipe: null,
    loading: true
  },

  onLoad: function(options) {
    if (options.id) {
      this.loadRecipeDetail(options.id)
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  // 加载菜谱详情
  loadRecipeDetail: function(id) {
    const db = wx.cloud.database()
    const that = this
    
    this.setData({ loading: true })
    
    db.collection('recipes').doc(id).get()
      .then(res => {
        that.setData({
          recipe: res.data,
          loading: false
        })
      })
      .catch(err => {
        console.error('加载菜谱详情失败', err)
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        })
        that.setData({ loading: false })
      })
  },

  // 预览图片
  previewImage: function(e) {
    const current = e.currentTarget.dataset.src
    const urls = this.data.recipe.images
    
    wx.previewImage({
      current,
      urls
    })
  },

  // 返回上一页
  goBack: function() {
    wx.navigateBack()
  }
})