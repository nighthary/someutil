var Util = function() {

    /*
     *  检测是否是NaN
     */
    function isReallyNaN(x) {
        return x !== x;
    }

    /**
     * 小数相乘精度变化问题修复
     */
    function mul(num1, num2) {
        var m = 0,
            s1 = num1.toString(),
            s2 = num2.toString();
        try { m += s1.split(".")[1].length } catch (e) {}
        try { m += s2.split(".")[1].length } catch (e) {}
        return Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m)
    }

    /**
     * 小数除法精度变化问题修复
     */
    function div(n1, n2) {
        var t1 = 0,
            t2 = 0,
            r1, r2;
        try { t1 = n1.toString().split(".")[1].length } catch (e) {}
        try { t2 = n2.toString().split(".")[1].length } catch (e) {}
        with(Math) {
            r1 = Number(n1.toString().replace(".", ""))
            r2 = Number(n2.toString().replace(".", ""))
            return (r1 / r2) * pow(10, t2 - t1);
        }
    }

    /**
     * 小数加法精度变化问题修复
     */
    function add(n1, n2) {
        var r1, r2, m;
        try { n1 = this.toString().split(".")[1].length } catch (e) { r1 = 0 }
        try { n2 = arg.toString().split(".")[1].length } catch (e) { r2 = 0 }
        m = Math.pow(10, Math.max(r1, r2))
        return (this * m + arg * m) / m
    }

    /**
     * 小数减法法精度变化问题修复
     */
    function sub(arg) {
        return add(-arg);
    }

    /**
     * 深拷贝(复制)对象&数组
     */
    function deepCopy(b) {
        var a = {};
        //如果为数组
        if(b instanceof Array){
            a = [];
            for(var i = 0,c = b.length; i< c; i++){
                a.push(typeof b[i] == 'object' ? deepCopy(b[i]) : b[i])
            }
        }else if(b instanceof Object){//如果是对象
            for (var d in b) {
                a[d] = typeof b[d] === 'object' ? deepCopy(b[d]) : b[d];
            }
        }else{//其他
            a = b;
        }

        return a;
    }

    return {
        isNaN: isReallyNaN,
        mul: mul,
        div: div,
        add: add,
        sub: sub,
        deepCopy: deepCopy
    }
}();

