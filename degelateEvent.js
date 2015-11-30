//这个版本需要在angular之前 引用 jquery。 
//后面发布一个不需 jquery 的版本。或者讲该版本修改一下,不需jquery也可行。

/*  test
<div delegate-click="pclick($event,$target)" selector-click="h1" id="bbb">
      <h1>h1h1 <span>span</span></h1>
      ssssss
      <span>.q</span>
</div>

$scope.pclick = function(){
  console.log(arguments);
}

console:
event, <h1></h1> h1 target
*/

;(function(window,angular,undefined){

  var ngEvent = {};
  // angular 官方 git 上, ngEventDirs 中写道。
  /**************************************************/
  // For events that might fire synchronously during DOM manipulation
  // we need to execute their event handlers asynchronously using $evalAsync,
  // so that they are not executed in an inconsistent state.
  /**************************************************/
  // 在操作 DOM 期间 可能会同步触发的事件
  // 我们需要用 $evalAsync 来异步执行这些事件的 handle
  // 这样就不会在一个反常的环境中执行了。
  // ??????????????????????????????????????
  // 任何事件触发后,不是把 handler 放在事件队列中,等主进程空了后再拿出来运行吗？
  // 即使是我操作 DOM 而触发的事件,也是这样。会等待当前 digest 循环完毕后才执行的呀。
  // 这样,目前的环境就已经稳定了呀？ 
  // 难倒 digest循环中也有异步处理? 可是有也不能保证 digest中的异步处理在该 处理之前呀。
  // 所以 digest 循环中是没有异步处理的。
  // 关于这个设定,有点不懂。不过为了安全起见，我也这样写。

  var forceAsyncEvents = {
    'blur': true,
    'focus': true
  };  

  angular.forEach(
    'Click Dblclick Mousedown Mouseup Mouseover Mouseout Mousemove Mouseenter Mouseleave Keydown Keyup Keypress Submit Focus Blur Copy Cut Paste'.split(' '),
    function(eventName) {
      var directiveName = 'delegate' + eventName;
      ngEvent[directiveName] = ['$parse', '$rootScope', function($parse, $rootScope) {
        return {
          restrict: 'A',
          compile: function($element, attr) {
            // $parse 中第二个参数是 拦截函数, 如果有,则会以这个函数的返回值为准(没有return, 就是 undefined)。该函数 第一个参数是 真实运行的值,第二个参数是 调用生成的解析函数时所传入的值。
            /**************************************************/
            //We explicitly request better checks at the cost of speed since event handler expressions are not executed as frequently as regular change detection.
            /**************************************************/
            //大概解释下: 当 event handler 执行没 “regular change detection”(这是什么意思呀？？？定期改变发现？？ 难倒是 脏值检测？) 这么频繁时,我们就以花费速度为代价 明确要求 进行更好的监测。
            // 这是什么意思？？求解。 这是 $parse 第三个参数的含义。

            var fn = $parse(attr[directiveName],null,true);

            //在编译阶段就可以先解析所需要运行的 函数。
            //如果放在 link 阶段, 一个 ng-repeat,那么这个 所需要运行的函数 可能就会被解析多次.
            
            return function (scope, element, attr) { //返回 link阶段函数

              var selector = attr["selector" + eventName];//获取selector

              element.on(eventName.toLowerCase(), selector, function(event) { //在具体的element上监听事件
                var me = this;
                //包装一下,让解析的函数在该scope上下文中运行,并且同时在该scope之前设置一个scope.
                var callback = function() { 
                  // 最理想的写法是如下,把点击时,符合selector的元素传入函数中运行。
                  // 但是会报错,错误信息如下。
                  // Referencing DOM nodes in Angular expressions is disallowed!
                  // 在angular表达式中,不允许涉及到 dom节点。
                  // fn(scope, {$event:event,$target:me});

                  // 但是把他隐藏一个层级即可
                   fn(scope, {$event:event,$target:{target:me}});
                };
                if (forceAsyncEvents[eventName] && $rootScope.$$phase) {
                  scope.$evalAsync(callback); //最开始的注释,某些事件在 digest时需要异步执行。
                } else {
                  scope.$apply(callback); //运行该 callback ,然后触发下一次digest.
                }
              });
            };
          }
        };
      }];
    }
  );
// var module = angular.module('delegateEvent', []);
// for (var i in ngEvent) {
//   module.directive(i,ngEvent[i]);
// };
  angular.module('delegateEvent', []).directive(ngEvent);
  console.log(ngEvent);
})(window,window.angular);
