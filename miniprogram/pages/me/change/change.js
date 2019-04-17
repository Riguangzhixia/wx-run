//index.js
const app = getApp()

Page({
  data: {
    avatarUrl: './user-unlogin.png',
    userInfo: {},
    logged: false,
    takeSession: false,
    requestResult: '',
    flag: null,
    days: 10
  },

  onLoad: function () {
    wx.cloud.init()
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        /* console.log('[云函数] [login] user openid: ', res.result.openid)*/
        app.globalData.openid = res.result.openid
        /* console.log(app.globalData.openid)*/
        app.userInfoReadyCallback = res => {
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      },
      fail: err => {
        /* console.error('[云函数] [login] 调用失败', err)*/
      }
    }),
    this.wxlogin();
    if (!wx.cloud) {
      wx.redirectTo({
        url: '../chooseLib/chooseLib',
      })
      return
    }

    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              this.setData({
                avatarUrl: res.userInfo.avatarUrl,
                userInfo: res.userInfo
              })
            }
          })
        }
      }
    })
    console.log(app.globalData)
  },
  formSubmit: function (e) {
    wx.cloud.init();
    const db = wx.cloud.database()
    const that = this
    
    //  查询当前用户所有的
    const X = db.command
    wx.showLoading({
      title: '更新数据中',
    })
    if (e.detail.value.name && e.detail.value.number) {
      db.collection('student').where({
        _openid: app.globalData.openid
      }).get({
        success: function (res) {
          db.collection('student').doc(res.data[0]._id).update({
            data:{
            name: e.detail.value.name
            },
            success: res => {
              wx.showModal({
                title: '提示',
                content: '更新成功',
              })
              wx.hideLoading();
            }
          })
        },
        fail: function (res) {
          wx.showModal({
            title: '提示',
            content: '更新失败',
          })
        },
        complete:function(res){

        }
      })
        }
    this.wxlogin();
        
  },

  wxlogin: function (event) {
    //检测学号和wx是否绑定上传，如没有则flag=1，不可修改，否则显示修改页面。
    const db = wx.cloud.database()
    const that = this
    //  查询当前用户所有的
    const X = db.command
    db.collection('student').where({
      _openid: app.globalData.openid
    }).get({
      success: res => {
        if (res.data.length == 0) {
          this.setData({
            flag: 0
          })
          //console.log(this.data.flag)
          db.collection('student').where({
            _openid: app.globalData.openid
          }).get({
            success: res => {
              app.globalData.data = res.data.data//获取学号方便查询个人状态
            }
          })
        }
        else {
            //console.log(this.data.flag)
            this.setData({
              flag: 1
            })
        }
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '数据库连接失败',
        })
        console.error('[数据库] [链接]] 失败：', err)
      }
    })
  },
  onGetUserInfo: function (e) {
    if (!this.logged && e.detail.userInfo) {
      this.setData({
        logged: true,
        avatarUrl: e.detail.userInfo.avatarUrl,
        userInfo: e.detail.userInfo
      })
    }
  },

  onGetOpenid: function () {
    // 调用云函数
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        console.log('[云函数] [login] user openid: ', res.result.openid)
        app.globalData.openid = res.result.openid
        wx.navigateTo({
          url: '../userConsole/userConsole',
        })
      },
      fail: err => {
        console.error('[云函数] [login] 调用失败', err)
        wx.navigateTo({
          url: '../deployFunctions/deployFunctions',
        })
      }
    })
  },

  // 上传图片
  doUpload: function () {
    // 选择图片
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {

        wx.showLoading({
          title: '上传中',
        })

        const filePath = res.tempFilePaths[0]

        // 上传图片
        const cloudPath = 'my-image' + filePath.match(/\.[^.]+?$/)[0]
        wx.cloud.uploadFile({
          cloudPath,
          filePath,
          success: res => {
            console.log('[上传文件] 成功：', res)

            app.globalData.fileID = res.fileID
            app.globalData.cloudPath = cloudPath
            app.globalData.imagePath = filePath

            wx.navigateTo({
              url: '../storageConsole/storageConsole'
            })
          },
          fail: e => {
            console.error('[上传文件] 失败：', e)
            wx.showToast({
              icon: 'none',
              title: '上传失败',
            })
          },
          complete: () => {
            wx.hideLoading()
          }
        })

      },
      fail: e => {
        console.error(e)
      }
    })
  },

})
