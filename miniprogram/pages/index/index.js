//index.js
const app = getApp()
import initCalendar from '../../component/calendar/main.js';
import { setTodoLabels } from '../../component/calendar/main.js';
import { jump } from '../../component/calendar/main.js';
import { setSelectedDays } from '../../component/calendar/main.js';

// 待办事项中若有 todoText 字段，则会在待办日期下面显示指定文字，如自定义节日等。
const conf = {
  multi: true, // 是否开启多选,
  disablePastDay: true, // 是否禁选过去的日期
  /**
   * 初始化日历时指定默认选中日期，如：'2018-3-6' 或 '2018-03-06'
   * 注意：若想初始化时不默认选中当天，则将该值配置为除 undefined 以外的其他非值即可，如：空字符串, 0 ,false等。
  */
  defaultDay: '2018-3-6', // 初始化后是否默认选中指定日期
  noDefault: true, // 初始化后是否自动选中当天日期，优先级高于defaultDay配置，两者请勿一起配置
  /**
   * 选择日期后执行的事件
   * @param { object } currentSelect 当前点击的日期
   * @param { array } allSelectedDays 选择的所有日期（当mulit为true时，才有allSelectedDays参数）
   */
  afterTapDay: (currentSelect, allSelectedDays) => { },
  /**
   * 当改变月份时触发
   * @param { object } current 当前年月
   * @param { object } next 切换后的年月
   */
  whenChangeMonth: (current, next) => { },
  /**
   * 日期点击事件（此事件会完全接管点击事件）
   * @param { object } currentSelect 当前点击的日期
   * @param { object } event 日期点击事件对象
   */
  onTapDay(currentSelect, event) { },
  /**
   * 日历初次渲染完成后触发事件，如设置事件标记
   * @param { object } ctx 当前页面实例
   */
  afterCalendarRender(ctx) { },
}


Page({
  data: {
    avatarUrl: './user-unlogin.png',
    userInfo: {},
    logged: false,
    takeSession: false,
    requestResult: '',
    flag:null,
    days:null,
    content: null
  },
  loaddays:function(){
    var that = this;
    const db = wx.cloud.database()
    const _ = db.command
    db.collection('student').where({
      _openid: app.globalData.openid
    }).get({
      success(res){
        setSelectedDays(res.data[0].data);
        that.setData({
          days:res.data[0].sum
        })
      }
    })
  },
  onLoad: function() {
    
    initCalendar(conf);
    
   
    wx.cloud.init();
    const db = wx.cloud.database()

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
    })
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
  onReady:function(){
     // 待办事项中若有 todoText 字段，则会在待办日期下面显示指定文字，如自定义节日等。
    jump();
    this.loaddays();

  }, 

  formSubmit: function (e) {
    wx.cloud.init();
    const db = wx.cloud.database()
    const that = this
    //  查询当前用户所有的
    const X = db.command
    db.collection('student').where({
      _openid: app.globalData.openid
    }).get({
      success: res => {
        if (res.data.length != 0) {
          wx.showToast({
            icon: 'none',
            title: '数据已存在，出错请联系管理员',
          })
        }
        else {
          if (e.detail.value.name) {
                    db.collection('student').add({
                      data: {
                        name: e.detail.value.name,
                        number: e.detail.value.number,
                        data: [],
                        sum: 0
                      },
                      success: res => {
                        // 在返回结果中会包含新创建的记录的 _id
                        console.log('[数据库] [新增记录] 成功，记录 _id: ', res._id)
                        wx.showModal({
                          title: '提示',
                          content: '上传信息成功',
                        })
                      },
                      fail: err => {
                        wx.showToast({
                          icon: 'none',
                          title: '新增记录失败'
                        })
                        console.error('[数据库] [新增记录] 失败：', err)
                      }
                    })
                    if (res.confirm) {
                      /* console.log('用户点击确定')*/
                    } else if (res.cancel) {
                      /* console.log('用户点击取消')*/
                    }
          }
          else {
            wx.showToast({
              icon: 'none',
              title: '信息不完整请填写完整后提交',
            })
          }

        }
      }
    })
  this.wxlogin();
  },

  wxlogin: function (event) {
    //检测学号和wx是否绑定上传，如没有则flag=1，显示注册界面。
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
          wx.showToast({
            icon: 'none',
            title: '匹配账户信息中~'
          }),
            //console.log(this.data.flag)
            this.setData({
              flag: 1
            })
            /*,
            wx.request({
              url: 'https://start.xdface.cn/test.py',//此处填写你后台请求地址
              method: 'GET',
              header: { 'Content-Type': 'application/json' },
              data: {},
              success: function (res) {
                // success
                //console.log(res.data);//打印请求返回的结果
              },
              fail: function (res) {
                // fail
              },
              complete: function (res) {
                // complete
              }
            })*/
          /*向服务器发送学号密码存入数据库*/
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
  onGetUserInfo: function(e) {
    if (!this.logged && e.detail.userInfo) {
      this.setData({
        logged: true,
        avatarUrl: e.detail.userInfo.avatarUrl,
        userInfo: e.detail.userInfo
      })
    }
  },

  onGetOpenid: function() {
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
