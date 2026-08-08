---
title: 关于崇实战队整车代码框架重构
published: 2026-8-6
updated: 2026-8-6
pinned: false
description: 我直说了，现在的框架就是一坨
tags: [重构]
category: RM
licenseName: "CC BY 4.0"
author: RYCD
draft: false
cover: '/assets/images/WUST_RM_logo.png'
copyProtection:
    blockSelection: true
    blockClipboard: false
    blockContextMenu: true
    blockDevTools: false
---

## 现在的框架为什么一坨

带大家看看现在的目录结构：

``` Plain Text
.
├── Core                            ← 主程序与系统文件
│   ├── Inc                          
│   └── Src                          
│   
├── Drivers                         ← 官方驱动层，芯片底层支持，不动
│   ├── CMSIS                       ← 内核标准层：ARM官方Cortex-M内核定义
│   └── STM32G4xx_HAL_Driver        ← HAL库：ST官方硬件抽象层，封装寄存器操作          
│
├── MDK-ARM                         ← Keil MDK项目配置/构建文件
│
├── Middlewares                     ← 中间件（RTOS/USB）
│
├── Project                         ← 用户代码
│   ├── Algorithm_Drivers           ← 算法层：PID、滤波、姿态解算
│   ├── BSP                         ← 板级支持层：LED、按键、板载外设初始化
│   ├── Commnuicate_Drivers         ← 通信层：CAN（控电机）、串口、USB
│   ├── Hardware_Drivers            ← 硬件抽象层：电机、IMU、陀螺仪驱动
│   ├── Robot_Application           ← 应用层：机器人逻辑
│   ├── UI                          ← 这个才是正在使用的
│   ├── UI-backup                   ← 没用
│   └── Vision_Old                  ← 旧版视觉
│
├── UI                              ← 没用
│
└── USB_Device                      ← ⑦ USB设备应用层

```

这里看起来虽然不是公认的分层方式，但还是有层次感的，那么让我们继续看看/Project/

``` Plain Text
Project
├── Algorithm_Drivers
│   ├── controller.c
│   ├── controller.h
│   ├── CRC8_CRC16.c
│   ├── CRC8_CRC16.h
│   ├── Function.c          ←  工具函数库
│   ├── Function.h
│   ├── kalman_filter.c
│   ├── kalman_filter.h
│   ├── Motor_Compensation.c
│   ├── Motor_Compensation.h
│   ├── PID.c
│   ├── PID.h
│   ├── Power_Limit.c
│   ├── Power_Limit.h
│   ├── QuaternionEKF.c
│   ├── QuaternionEKF.h
│   ├── user_lib.c
│   ├── user_lib.h
│   ├── Vofa.c
│   └── Vofa.h                ←  VOFA+是串口调试协议，不是算法！
├── BSP
│   ├── BMI088driver.c
│   ├── BMI088driver.h
│   ├── BMI088Middleware.c
│   ├── BMI088Middleware.h
│   ├── BMI088reg.h
│   ├── Buzzer.c
│   ├── Buzzer.h
│   ├── DWT.c
│   ├── DWT.h
│   ├── Flash.c
│   ├── Flash.h
│   ├── Key.c
│   ├── Key.h
│   ├── LED.c
│   ├── LED.h
│   ├── PWM.c
│   └── PWM.h
├── Commnuicate_Drivers
│   ├── CAN_Driver.c
│   ├── CAN_Driver.h
│   ├── USART_Driver.c
│   ├── USART_Driver.h
│   ├── USB_Driver.c
│   └── USB_Driver.h
├── Hardware_Drivers
│   ├── Motor_DAMIAO_Driver.c
│   ├── Motor_DAMIAO_Driver.h
│   ├── Motor_DJI_Driver.c
│   ├── Motor_DJI_Driver.h
│   ├── Motor_DrEmpower.c
│   ├── Motor_DrEmpower.h
│   ├── Motor_Driver.c
│   ├── Motor_Driver.h
│   ├── Motor_Unitree_Driver.c
│   ├── Motor_Unitree_Driver.h
│   ├── Referee_Unpack.c
│   ├── Referee_Unpack.h
│   ├── Remote_Control.c
│   ├── Remote_Control.h
│   ├── SuperCap_Driver.c
│   └── SuperCap_Driver.h
├── Robot_Application
│   ├── Aim.c
│   ├── Aim.h
│   ├── Chassis.c
│   ├── Chassis.h
│   ├── Communicate.c
│   ├── Communicate.h
│   ├── Define.h
│   ├── ErrorHandle.c
│   ├── Gimbal.c
│   ├── Gimbal.h
│   ├── INS.c
│   ├── INS.h
│   ├── Key_LED.c
│   ├── Key_LED.h
│   ├── RoboControl.c
│   ├── RoboControl.h
│   ├── Shoot.c
│   └── Shoot.h
├── UI
│   ├── ui_g.c
│   ├── ui_g.h
│   ├── ui.h
│   ├── ui_interface.c
│   ├── ui_interface.h
│   ├── UI_Task.c
│   ├── UI_Task.h
│   └── ui_types.h
├── UI-backup
│   ├── ui_default_Dynamic_0.c
│   ├── ui_default_Dynamic_0.h
│   ├── ui_default_Dynamic_1.c
         ......
│   ├── ui.h
│   ├── ui_interface.c
│   ├── ui_interface.h
│   ├── UI_Task.c
│   ├── UI_Task.h
│   └── ui_types.h
└── Vision_Old
    ├── Aim.c
    ├── Aim.h
    ├── solve_trajectory.c
    ├── solve_trajectory.h
    ├── Vision_Data_Center.c
    └── Vision_Data_Center.h

```

大体上按照功能分类但是
PID有两个，用户工具函数库有两个，全局变量满天飞，还有一些目录上看不出来的问题，比如数据传输链路过于复杂，结构体封装让人看不懂
本来写了一堆注释批判的，越写越乱，不写了，自行分辨

所以要重构（怒）

## 如何重构

参考[嵌入式软件架构设计](https://openvela.csdn.net/69c4cfb354b52172bc64acaf.html)，将当前老框架按照调用层次重构为**六层架构**:

1. **通用基础层（Common）**
2. **硬件抽象层（HAL）**
3. **设备驱动层（DRV）**
4. **服务层（SRV）**
5. **应用层（APP）**
6. **入口层（ENT）**

遵循*四项原则*:

1. **单向依赖原则**：上层只能调用直接下层的接口，严禁跨层调用。例如应用层不能直接操作硬件寄存器，必须通过硬件抽象层完成；
2. **接口隔离原则**：每层仅对外暴露稳定、简洁的头文件接口，内部实现细节完全封装在.c文件中，接口一旦确定，尽可能不做破坏性修改；
3. **业务与硬件分离原则**：业务逻辑必须集中在上层，硬件操作全部下沉到底层，确保业务代码与硬件平台无关，实现“一次编写，多平台移植”；
4. **可复用性原则**：通用能力下沉为服务组件，避免重复造轮子，例如调度服务、存储服务、协议解析服务等，可跨项目、跨业务复用。

计划使用一些C语言模拟面向对象技巧

> 小叶小叶，既然都面向对象了为什么不用C艹，答：一个是我c++水平太差，写出来的不好意思给各位用。另一个是因为框架是给战队写的，就电控组目前来说大部分人都不会c++，写出来大家都不会用就不好了（但是如果有机会我还是想玩玩c++的）
