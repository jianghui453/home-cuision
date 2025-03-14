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
        // 新增错误处理逻辑，可根据实际情况调整
        wx.showModal({
          title: '错误提示',
          content: '加载菜谱详情失败，请检查网络或稍后重试。',
          showCancel: false
        })
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
  },

  // 编辑菜谱
  editRecipe: function() {
    const id = this.data.recipe._id
    wx.navigateTo({
      url: `/pages/recipes/add/add?id=${id}`
    })
  },

  // 删除菜谱
  deleteRecipe: function() {
    const id = this.data.recipe._id
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
              // 返回上一页并刷新列表
              wx.navigateBack()
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