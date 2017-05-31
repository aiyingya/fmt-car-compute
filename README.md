# fmt-car-compute

汽车保险的计算

## getApp()

```
import compute from 'fmt-car-compute'
const vehicleAndVesselTax = compute.getVehicleAndVesselTax({capacity:1.6,place:'上海'})
```

## promise

```
import compute from 'fmt-car-compute'
async login() {
  await compute.getLicenseFee();
}
```

## finally方法
方法内为一个可执行函数
```
server.listen(0).then(res=>{}).finally(server.stop)
```

## Installation
```
npm install fmt-car-compute --save
或
yarn add fmt-car-compute
```

## 谢谢
[某某之家](http://j.autohome.com.cn/quankuan_calculation.html)

