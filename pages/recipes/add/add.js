// pages/recipes/add/add.js
const app = getApp()

Page({
  data: {
    recipe: {
      dishName: '',
      introduction: '',
      cookingMethod: '',
      images: []
    },
    isEdit: false,
    recipeId: '',
    maxImageCount: 9,
    maxIntroLength: 200,
    maxMethodLength: 1000,
    submitting: false
  },

  onLoad: function(options) {
    // 如果有id参数，说明是编辑模式
    if (options.id) {
      this.setData({
        isEdit: true,
        recipeId: options.id
      })
      this.loadRecipeData(options.id)
    }
  },

  // 加载菜谱数据（编辑模式）
  loadRecipeData: function(id) {
    const db = wx.cloud.database()
    const that = this
    
    wx.showLoading({
      title: '加载中'
    })
    
    db.collection('recipes').doc(id).get()
      .then(res => {
        that.setData({
          recipe: res.data
        })
        wx.hideLoading()
      })
      .catch(err => {
        console.error('加载菜谱数据失败', err)
        // 新增错误处理逻辑，可根据实际情况调整
        wx.showModal({
          title: '错误提示',
          content: '加载菜谱数据失败，请检查网络或稍后重试。',
          showCancel: false
        })
        wx.hideLoading()
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        })
      })
  },

  // 输入菜名
  inputDishName: function(e) {
    this.setData({
      'recipe.dishName': e.detail.value
    })
  },

  // 输入介绍
  inputIntroduction: function(e) {
    this.setData({
      'recipe.introduction': e.detail.value
    })
  },

  // 输入做法
  inputCookingMethod: function(e) {
    this.setData({
      'recipe.cookingMethod': e.detail.value
    })
  },

  // 选择图片
  chooseImage: function() {
    const that = this
    const currentImages = this.data.recipe.images
    const remainCount = this.data.maxImageCount - currentImages.length
    
    if (remainCount <= 0) {
      wx.showToast({
        title: `最多上传${this.data.maxImageCount}张图片`,
        icon: 'none'
      })
      return
    }
    
    wx.chooseImage({
      count: remainCount,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        // 上传图片到云存储
        that.uploadImages(res.tempFilePaths)
      }
    })
  },

  // 上传图片到云存储
  uploadImages: function(tempFilePaths) {
    const that = this
    const uploadTasks = []
    const currentImages = this.data.recipe.images
    
    wx.showLoading({
      title: '上传中'
    })
    
    // 循环上传图片
    tempFilePaths.forEach(filePath => {
      const cloudPath = `recipe_images/${Date.now()}_${Math.floor(Math.random() * 1000)}.${filePath.match(/\.([^.]+)$/)[1]}`
      
      const uploadTask = wx.cloud.uploadFile({
        cloudPath,
        filePath,
        success: res => {
          currentImages.push(res.fileID)
          that.setData({
            'recipe.images': currentImages
          })
        },
        fail: err => {
          console.error('上传图片失败', err)
          wx.showToast({
            title: '图片上传失败',
            icon: 'none'
          })
        }
      })
      
      uploadTasks.push(uploadTask)
    })
    
    // 所有图片上传完成后
    Promise.all(uploadTasks).then(() => {
      wx.hideLoading()
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

  // 删除图片
  deleteImage: function(e) {
    const index = e.currentTarget.dataset.index
    const images = this.data.recipe.images
    
    images.splice(index, 1)
    
    this.setData({
      'recipe.images': images
    })
  },

  // 提交表单
  submitForm: function() {
    const recipe = this.data.recipe
    
    // 表单验证
    if (!recipe.dishName.trim()) {
      wx.showToast({
        title: '请输入菜名',
        icon: 'none'
      })
      return
    }
    
    if (!recipe.introduction.trim()) {
      wx.showToast({
        title: '请输入菜品介绍',
        icon: 'none'
      })
      return
    }
    
    if (!recipe.cookingMethod.trim()) {
      wx.showToast({
        title: '请输入做法步骤',
        icon: 'none'
      })
      return
    }
    
    if (recipe.images.length === 0) {
      wx.showToast({
        title: '请至少上传一张图片',
        icon: 'none'
      })
      return
    }
    
    // 防止重复提交
    if (this.data.submitting) return
    
    this.setData({ submitting: true })
    
    const db = wx.cloud.database()
    const that = this
    
    wx.showLoading({
      title: this.data.isEdit ? '保存中' : '提交中'
    })
    
    // 编辑模式
    if (this.data.isEdit) {
      db.collection('recipes').doc(this.data.recipeId).update({
        data: {
          dishName: recipe.dishName,
          introduction: recipe.introduction,
          cookingMethod: recipe.cookingMethod,
          images: recipe.images,
          updateTime: db.serverDate()
        }
      })
      .then(() => {
        wx.hideLoading()
        wx.showToast({
          title: '保存成功'
        })
        that.setData({ submitting: false })
        // 返回上一页
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      })
      .catch(err => {
        console.error('保存失败', err)
        wx.hideLoading()
        wx.showToast({
          title: '保存失败，请重试',
          icon: 'none'
        })
        that.setData({ submitting: false })
      })
    } 
    // 新增模式
    else {
      db.collection('recipes').add({
        data: {
          dishName: recipe.dishName,
          introduction: recipe.introduction,
          cookingMethod: recipe.cookingMethod,
          images: recipe.images,
          createTime: db.serverDate()
        }
      })
      .then(() => {
        wx.hideLoading()
        wx.showToast({
          title: '添加成功'
        })
        that.setData({ submitting: false })
        // 返回上一页
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      })
      .catch(err => {
        console.error('添加失败', err)
        wx.hideLoading()
        wx.showToast({
          title: '添加失败，请重试',
          icon: 'none'
        })
        that.setData({ submitting: false })
      })
    }
  },

  // 返回上一页
  goBack: function() {
    wx.navigateBack()
  }
})