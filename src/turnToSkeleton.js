"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.turnToSkeleton = turnToSkeleton;
function setSkeletonStyle(element) {
    var width = element.offsetWidth;
    var height = element.offsetHeight;
    element.style.background = '#e0e0e0';
    element.style.borderRadius = '4px';
    element.style.width = "".concat(width, "px");
    element.style.height = "".concat(height, "px");
    element.innerHTML = '';
}
function turnToSkeleton(deep) {
    // 删除超出视窗的元素
    var elements = document.querySelectorAll('*');
    elements.forEach(function (el) {
        if (el.getBoundingClientRect().top > window.innerHeight) {
            el.remove();
        }
    });
    // 由body开始遍历指定深度的元素
    var body = document.body;
    // 遍历指定深度的元素
    var traverse = function (el, depth) {
        if (depth > 0) {
            if (el.childNodes.length > 0) {
                el.childNodes.forEach(function (child) {
                    if (child instanceof HTMLElement) {
                        traverse(child, depth - 1);
                    }
                });
            }
            else {
                setSkeletonStyle(el);
            }
        }
        setSkeletonStyle(el);
    };
    traverse(body, deep);
}
