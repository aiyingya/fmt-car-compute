'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _ajaxWeb = require('./ajax-web');

var _ajaxWeb2 = _interopRequireDefault(_ajaxWeb);

var _ajaxWx = require('./ajax-wx');

var _ajaxWx2 = _interopRequireDefault(_ajaxWx);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Created by Eliya on 17/5/26.
 * From1. http://j.autohome.com.cn/quankuan_calculation.html
 * From2. http://city.emao.com/chexianjisuanqi/chexian.html
 *
 * 必要花费
 *  --购置税＝ 购车款 / ( 1 + 17% ) × 购置税率( 10% ) (排量1.6及以上的车型购置税不变，1.6（含）以下的购置税 × 0.75)
 *  --上牌费用 = 自定义价格，一般（最低 500 元）
 *  --车船使用税 = 各省不统一，接口调用
 *  --交强险（交通事故责任强制保险）= 家用 6 座以下 950 元/年，家用 6 座及以上 1100 元/年
 *
 * 商业保险
 *  --第三者责任险 = 保费（保费：需要通过【家用 6 座以下／上 】以及 【赔付额度选择】 来获取固定保费）
 *  --车辆损失险 = 基础保费 + 裸车价格 × 1.28%（基础保费：需要通过【家用 6 座以下／上】 的纬度来获取固定费用）
 *  --全车盗抢险 = 基础保费 + 裸车价格 × 费率（基础保费与费率：需要通过【家用 6 座以下／上】的纬度来获取固定费用）
 *  --玻璃单独破碎险 = 新车购置价 × 百分比，国产新车购置价×百分比（百分比：需要通过家【用 6 座以下／上】以及【国产／进口选择】的纬度来获取固定百分比）
 *  --自燃损失险 = 新车购置价 × 0.15%
 *  --不计免赔特约险 = (车辆损失险+第三者责任险) × 20%
 *  --无过责任险 = 第三者责任险保险费 × 20%
 *  --车上人员责任险 =  裸车价 ×（驾驶人费率 + 乘客费率）（驾驶人费率 + 乘客费率：需要通过【家用 6 座以下／上】的纬度来获取固定费率）
 *  --车身划痕险 = 保费（保费：需要通过【裸车价的30万以下、30-50万、50万以上】以及【保额2千、5千、1万、2万的选择】 的纬度来获取固定费用）
 *
 */
'use strict';
/**
 *根据spu规格计算保险
 */
var spuStandard = {
  /**
   * 6座以下的各种金额
   */
  spuUnderSix: {
    /**
     * 交强险
     */
    traffic: 950,
    /**
     * 第三者责任险.
     */
    liability: {
      '5': 638, //5万额度的保费
      '10': 920, //10万额度的保费
      '20': 1141,
      '30': 1265,
      '50': 1546,
      '100': 2012
    },
    /**
     * 车辆损失险基础保费.
     */
    vehicleBasis: 539,
    /**
     * 全车盗抢险.
     */
    vehicleDQ: {
      basisPremium: 120, //基础保费
      rate: 0.0049 //费率
    },
    /**
     * 玻璃单独破碎险
     */
    glassBroken: [0.002, 0.0033], //[国产玻璃费率，进口玻璃费率]
    /**
     * 车上人员责任险
     */
    personnelCarRate: 0.0069 //驾驶人费率+乘客费率
  },
  /**
   * 6座以上的各种金额
   */
  spuAboveSix: {
    /**
     * 交强险
     */
    traffic: 1110,
    /**
     * 第三者责任险.
     */
    liability: {
      '5': 590, //5万额度的保费
      '10': 831, //10万额度的保费
      '20': 1014,
      '30': 1178,
      '50': 1352,
      '100': 1760
    },
    /**
     * 车辆损失险基础保费.
     */
    vehicleBasis: 646,
    /**
     * 全车盗抢险.
     */
    vehicleDQ: {
      basisPremium: 140, //基础保费
      rate: 0.0044 //费率
    },
    /**
     * 玻璃单独破碎险
     */
    glassBroken: [0.002, 0.0033], //[国产玻璃费率，进口玻璃费率]
    /**
     * 车上人员责任险
     */
    personnelCarRate: 0.0066 //驾驶人费率+乘客费率
  }
};

/**
 * 根据裸车价算车身划痕险.
 */
var scratches = {
  '2000': {
    one: 400, //裸车价30(one)万以下 且 2000保额 的保费
    two: 585, //裸车价30-50(two)万 且 2000保额 的保费
    three: 850 //裸车价50(three)万以上 且 2000保额 的保费
  },
  '5000': {
    one: 570, //裸车价30(one)万以下 且 5000保额 的保费
    two: 900, //裸车价30-50(two)万 且 5000保额 的保费
    three: 1100 //裸车价50(three)万以上 且 5000保额 的保费
  },
  '10000': {
    one: 760,
    two: 1170,
    three: 1500
  },
  '20000': {
    one: 1140,
    two: 1780,
    three: 2250
  }
};(function ($) {
  var ajaxUrl = function ajaxUrl() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'gqc';

    /* 设置请求类型. */
    var Urls = {
      DEV: 'https://test.yaomaiche.com/ymcdev/',
      GQC: 'https://test.yaomaiche.com/ymcgqc/',
      PRD: 'https://ymcapi.yaomaiche.com/ymc/'
    };
    return Urls[config.toUpperCase()];
  };

  var __request = (typeof wx === 'undefined' ? 'undefined' : (0, _typeof3.default)(wx)) === 'object' ? _ajaxWx2.default.request : _ajaxWeb2.default.request;

  var Compute = {

    options: {
      env: 'gqc',
      isLessThanSixSeats: true, //是否6座以下
      sellingPrice: 9999999999, //裸车价
      capacity: null, //排量 （电动车的排量是空）
      province: '上海', //提车城市
      sumAssured: 999999999, //保额（单位：元）
      isMadeInChina: true //是否中国制造
    },

    /**
     * 计算购置税
     */
    getPurchaseTax: function getPurchaseTax(opts) {
      opts = (0, _assign2.default)(this.options, opts);
      var _sellingPrice = opts.sellingPrice;

      var _price = Number(_sellingPrice / 1.17 * 0.1);
      if (opts.capacity) {
        return Number(capacity) > 1.6 ? _price : _price * 0.75;
      }
      return _price;
    },

    /**
     * 默认代收上牌费
     */
    getLicenseFee: function getLicenseFee() {
      return 500;
    },

    /**
     * 获取车船税
     */
    getVehicleAndVesselTax: function getVehicleAndVesselTax(opts) {
      if (!opts) return;
      opts = (0, _assign2.default)(this.options, opts);
      var _ref = [opts.env, opts.capacity, opts.province],
          _env = _ref[0],
          _capacity = _ref[1],
          _province = _ref[2];


      return __request({
        url: ajaxUrl(_env) + ('sale/quotation/getCarTax?capacity=' + _capacity + '&place=' + _province),
        type: 'GET'
      }).then(function (data) {
        return data;
      }, function (e) {
        console.log("获取车船税报错");
      });
    },

    /**
     * 计算交强险
     */
    getTrafficInsurance: function getTrafficInsurance(opts) {
      opts = (0, _assign2.default)(this.options, opts);
      var _isLessThanSixSeats = opts.isLessThanSixSeats;

      var money = _isLessThanSixSeats ? spuStandard.spuUnderSix.traffic : spuStandard.spuAboveSix.traffic;
      return Number(money);
    },

    /**
     * 第三者责任险
     * @param opts
     * @returns {number}
     */
    getLiabilityInsurance: function getLiabilityInsurance(opts) {
      opts = (0, _assign2.default)(this.options, opts);
      var _ref2 = [opts.isLessThanSixSeats, opts.sumAssured],
          _isLessThanSixSeats = _ref2[0],
          _sumAssured = _ref2[1];


      var money = _isLessThanSixSeats ? spuStandard.spuUnderSix.liability[Number(_sumAssured / 10000)] : spuStandard.spuAboveSix.liability[Number(_sumAssured / 10000)];
      return Number(money);
    },

    /**
    * 车辆损失险
    */
    vehicleDamageInsurance: function vehicleDamageInsurance(opts) {
      opts = (0, _assign2.default)(this.options, opts);
      var _ref3 = [opts.sellingPrice, opts.isLessThanSixSeats],
          _sellingPrice = _ref3[0],
          _isLessThanSixSeats = _ref3[1];


      var basis = _isLessThanSixSeats ? spuStandard.spuUnderSix.vehicleBasis : spuStandard.spuAboveSix.vehicleBasis;
      var money = basis * _sellingPrice * 0.0128;
      return Number(money);
    },

    /**
     * 全车盗抢险
     * @param opts
     * @returns {number}
     */
    getAllCarRobberInsurance: function getAllCarRobberInsurance(opts) {
      opts = (0, _assign2.default)(this.options, opts);
      var _ref4 = [opts.sellingPrice, opts.isLessThanSixSeats],
          _sellingPrice = _ref4[0],
          _isLessThanSixSeats = _ref4[1];


      var base = _isLessThanSixSeats ? spuStandard.spuUnderSix.vehicleDQ.basisPremium : spuStandard.spuAboveSix.vehicleDQ.basisPremium;
      var rate = _isLessThanSixSeats ? spuStandard.spuUnderSix.vehicleDQ.rate : spuStandard.spuAboveSix.vehicleDQ.rate;
      var money = base + _sellingPrice * rate;
      return Number(money);
    },

    /**
     * 玻璃单独破碎险
     * @param opts
     * @returns {number}
     */
    getRiskOfGlassSeparatelyInsurance: function getRiskOfGlassSeparatelyInsurance(opts) {
      opts = (0, _assign2.default)(this.options, opts);
      var _ref5 = [opts.sellingPrice, opts.isMadeInChina, opts.isLessThanSixSeats],
          _sellingPrice = _ref5[0],
          _isMadeInChina = _ref5[1],
          _isLessThanSixSeats = _ref5[2];


      var rate = void 0;
      if (_isMadeInChina) {
        rate = _isLessThanSixSeats ? spuStandard.spuUnderSix.glassBroken[0] : spuStandard.spuAboveSix.glassBroken[0];
      } else {
        rate = _isLessThanSixSeats ? spuStandard.spuUnderSix.glassBroken[1] : spuStandard.spuAboveSix.glassBroken[1];
      }
      var money = _sellingPrice * rate;
      return Number(money);
    },

    /**
     * 自燃损失险
     * @param opts
     * @returns {number}
     */
    getRiskOfSpontaneousCombustion: function getRiskOfSpontaneousCombustion(opts) {
      opts = (0, _assign2.default)(this.options, opts);
      var _sellingPrice = opts.sellingPrice;

      var money = _sellingPrice * 0.0015;
      return Number(money);
    },

    /**
     * 不计免赔特约险
     * @param opts
     * @returns {number}
     */
    getExcludingDeductibleSpecialRisks: function getExcludingDeductibleSpecialRisks(opts) {
      opts = (0, _assign2.default)(this.options, opts);
      var _ref6 = [this.getLiabilityInsurance(opts), this.vehicleDamageInsurance(opts)],
          _liabilityInsurance = _ref6[0],
          _vehicleLossInsurance = _ref6[1];


      var money = 0;
      if (_liabilityInsurance > 0 && _vehicleLossInsurance > 0) {
        money = (_liabilityInsurance + _vehicleLossInsurance) * 0.2;
      }
      return Number(money);
    },

    /**
     * 无过责任险
     * @param opts
     * @returns {number}
     */
    getNoLiabilityInsurance: function getNoLiabilityInsurance(opts) {
      opts = (0, _assign2.default)(this.options, opts);
      var liabilityInsurance = this.getLiabilityInsurance(opts);
      var money = liabilityInsurance * 0.2;
      return Number(money);
    },

    /**
     * 车上人员责任险
     * @param opts
     * @returns {number}
     */
    getPersonnelCarInsurance: function getPersonnelCarInsurance(opts) {
      opts = (0, _assign2.default)(this.options, opts);
      var _ref7 = [opts.isLessThanSixSeats, opts.sellingPrice],
          _isLessThanSixSeats = _ref7[0],
          _sellingPrice = _ref7[1];


      var rate = _isLessThanSixSeats ? spuStandard.spuUnderSix.personnelCarRate : spuStandard.spuAboveSix.personnelCarRate;
      var money = _sellingPrice * rate;
      return Number(money);
    },

    /**
     * 车身划痕险
     * @param opts
     * @returns {number}
     */
    getRiskOfBodyScratch: function getRiskOfBodyScratch(opts) {
      opts = (0, _assign2.default)(this.options, opts);
      var _ref8 = [opts.sumAssured, opts.sellingPrice],
          _sumAssured = _ref8[0],
          _sellingPrice = _ref8[1];


      var money = 0;
      if (_sellingPrice / 10000 < 30) {
        money = scratches[_sumAssured].one;
      } else if (30 <= officialPrice / 10000 && officialPrice / 10000 <= 50) {
        money = scratches[_sumAssured].two;
      } else {
        money = scratches[_sumAssured].three;
      }
      return Number(money);
    }
  };
  //H5 demo使用
  window.__Compute = Compute;
  if (typeof module !== 'undefined') {
    //CommonJS 小程序使用
    module.exports = Compute;
  } else if (typeof define === 'function' && define.amd) {
    //AMD
    define([], function () {
      'use strict';

      return Compute;
    });
  }
})();

// export default  Compute;