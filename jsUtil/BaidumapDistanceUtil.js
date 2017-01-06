/**
 * 从百度地图抽里出来的获取两个经纬度点之间距离的计算方式
 * @Author    http://my.oschina.net/ipromise/blog/501756?fromerr=q6xQcCfx
 * @CreateDate 2016-04-15T13:42:47+0800
 */
define(function() {

    var DistanceUtil = {

        fD: function(a, b, c) {
            for (; a > c;)
                a -= c - b;
            for (; a < b;)
                a += c - b;
            return a;
        },

        jD: function(a, b, c) {
            b != null && (a = Math.max(a, b));
            c != null && (a = Math.min(a, c));
            return a;
        },

        yk: function(a) {
            return Math.PI * a / 180
        },

        Ce: function(a, b, c, d) {
            var dO = 6370996.81;
            return dO * Math.acos(Math.sin(c) * Math.sin(d) + Math.cos(c) * Math.cos(d) * Math.cos(b - a));
        },

        /**
         * 计算两个经纬度点之间的距离（从百度地图的api中抽离出来的）
         * @CreateDate 2016-04-15T13:40:02+0800
         * @param      {[Object]}               a [第一个点的经纬度对象{lng : 106.486654, lat: 29.490295}]
         * @param      {[Object]}               b [第二个点的经纬度对象{lng : 106.486654, lat: 29.490295}]
         * @return     {[Object]}                   [距离,单位米]
         *
         * alert(getDistance({
         *          lng : 106.486654,
         *          lat: 29.490295
         *      },{ lng : 106.581515,
         *          lat :29.615467
         *      })
         * );
         */
        getDistance: function(a, b) {
            if (!a || !b)
                return 0;
            a.lng = this.fD(a.lng, -180, 180);
            a.lat = this.jD(a.lat, -74, 74);
            b.lng = this.fD(b.lng, -180, 180);
            b.lat = this.jD(b.lat, -74, 74);
            return this.Ce(this.yk(a.lng), this.yk(b.lng), this.yk(a.lat), this.yk(b.lat));
        }
    }
    return DistanceUtil;
});
