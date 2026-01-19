// Written by Dor Verbin, October 2021
// This is based on: http://thenewcode.com/364/Interactive-Before-and-After-Video-Comparison-in-HTML5-Canvas
// With additional modifications based on: https://jsfiddle.net/7sk5k4gp/13/

function playVids(videoId) {
    var videoMerge = document.getElementById(videoId + "Merge");
    var vid = document.getElementById(videoId);

    var position = 0.5;
    var vidWidth = vid.videoWidth/2;
    var vidHeight = vid.videoHeight;

    var mergeContext = videoMerge.getContext("2d");

    
    if (vid.readyState > 3) {
        vid.play();

        function trackLocation(e) {
            // Normalize to [0, 1]
            bcr = videoMerge.getBoundingClientRect();
            position = ((e.pageX - bcr.x) / bcr.width);
        }
        function trackLocationTouch(e) {
            // Normalize to [0, 1]
            bcr = videoMerge.getBoundingClientRect();
            position = ((e.touches[0].pageX - bcr.x) / bcr.width);
        }

        videoMerge.addEventListener("mousemove",  trackLocation, false); 
        videoMerge.addEventListener("touchstart", trackLocationTouch, false);
        videoMerge.addEventListener("touchmove",  trackLocationTouch, false);


        function drawLoop() {
            mergeContext.drawImage(vid, 0, 0, vidWidth, vidHeight, 0, 0, vidWidth, vidHeight);
            var colStart = (vidWidth * position).clamp(0.0, vidWidth);
            var colWidth = (vidWidth - (vidWidth * position)).clamp(0.0, vidWidth);
            mergeContext.drawImage(vid, colStart+vidWidth, 0, colWidth, vidHeight, colStart, 0, colWidth, vidHeight);
            requestAnimationFrame(drawLoop);

            
            var arrowLength = 0.09 * vidHeight;
            var arrowheadWidth = 0.025 * vidHeight;
            var arrowheadLength = 0.04 * vidHeight;
            var arrowPosY = vidHeight / 10;
            var arrowWidth = 0.007 * vidHeight;
            var currX = vidWidth * position;

            // Draw circle
            mergeContext.arc(currX, arrowPosY, arrowLength*0.7, 0, Math.PI * 2, false);
            mergeContext.fillStyle = "#FFD79340";
            mergeContext.fill()
            //mergeContext.strokeStyle = "#444444";
            //mergeContext.stroke()
            
            // Draw border
            mergeContext.beginPath();
            mergeContext.moveTo(vidWidth*position, 0);
            mergeContext.lineTo(vidWidth*position, vidHeight);
            mergeContext.closePath()
            mergeContext.strokeStyle = "#AAAAAA";
            mergeContext.lineWidth = 5;            
            mergeContext.stroke();

            // Draw arrow
            mergeContext.beginPath();
            mergeContext.moveTo(currX, arrowPosY - arrowWidth/2);
            
            // Move right until meeting arrow head
            mergeContext.lineTo(currX + arrowLength/2 - arrowheadLength/2, arrowPosY - arrowWidth/2);
            
            // Draw right arrow head
            mergeContext.lineTo(currX + arrowLength/2 - arrowheadLength/2, arrowPosY - arrowheadWidth/2);
            mergeContext.lineTo(currX + arrowLength/2, arrowPosY);
            mergeContext.lineTo(currX + arrowLength/2 - arrowheadLength/2, arrowPosY + arrowheadWidth/2);
            mergeContext.lineTo(currX + arrowLength/2 - arrowheadLength/2, arrowPosY + arrowWidth/2);

            // Go back to the left until meeting left arrow head
            mergeContext.lineTo(currX - arrowLength/2 + arrowheadLength/2, arrowPosY + arrowWidth/2);
            
            // Draw left arrow head
            mergeContext.lineTo(currX - arrowLength/2 + arrowheadLength/2, arrowPosY + arrowheadWidth/2);
            mergeContext.lineTo(currX - arrowLength/2, arrowPosY);
            mergeContext.lineTo(currX - arrowLength/2 + arrowheadLength/2, arrowPosY  - arrowheadWidth/2);
            mergeContext.lineTo(currX - arrowLength/2 + arrowheadLength/2, arrowPosY);
            
            mergeContext.lineTo(currX - arrowLength/2 + arrowheadLength/2, arrowPosY - arrowWidth/2);
            mergeContext.lineTo(currX, arrowPosY - arrowWidth/2);

            mergeContext.closePath();

            mergeContext.fillStyle = "#AAAAAA";
            mergeContext.fill();

            
            
        }
        requestAnimationFrame(drawLoop);
    } 
}

Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};
    
    
function resizeAndPlay(element)
{
  var cv = document.getElementById(element.id + "Merge");
  cv.width = element.videoWidth/2;
  cv.height = element.videoHeight;
  element.play();
  element.style.height = "0px";  // Hide video without stopping it
    
  playVids(element.id);
}

// Functions for two separate video comparison
function playTwoVids(videoId1, videoId2, canvasId) {
    var videoMerge = document.getElementById(canvasId);
    var vid1 = document.getElementById(videoId1);
    var vid2 = document.getElementById(videoId2);

    var position = 0.5;
    var vidWidth = vid1.videoWidth;
    var vidHeight = vid1.videoHeight;

    var mergeContext = videoMerge.getContext("2d");

    function trackLocation(e) {
        bcr = videoMerge.getBoundingClientRect();
        position = ((e.pageX - bcr.x) / bcr.width);
    }
    function trackLocationTouch(e) {
        bcr = videoMerge.getBoundingClientRect();
        position = ((e.touches[0].pageX - bcr.x) / bcr.width);
    }

    videoMerge.addEventListener("mousemove", trackLocation, false);
    videoMerge.addEventListener("touchstart", trackLocationTouch, false);
    videoMerge.addEventListener("touchmove", trackLocationTouch, false);

    // 确保两个视频同步播放：让左边视频(vid1)对齐到右边视频(vid2)的时间轴
    // 使用命名函数以便移除事件监听器
    var timeUpdateHandler = null;
    var seekedHandler = null;
    
    function syncVideos() {
        if (vid1.readyState < 2 || vid2.readyState < 2) {
            return;
        }
        if (vid1.seeking || vid2.seeking) {
            return;
        }

        // 确保两个视频都在播放
        if (vid1.paused && !vid2.paused) {
            vid1.play().catch(function(err) {
                console.log('Left video play error:', err);
            });
        } else if (!vid1.paused && vid2.paused) {
            vid2.play().catch(function(err) {
                console.log('Right video play error:', err);
            });
        }

        var timeDiff = Math.abs(vid2.currentTime - vid1.currentTime);
        if (timeDiff > 0.2) {
            // 让左边视频对齐到右边视频的时间轴
            vid1.currentTime = vid2.currentTime;
        }
    }
    
    // 创建命名的事件处理器
    timeUpdateHandler = syncVideos;
    seekedHandler = function() {
        if (vid1.readyState > 0 && vid2.readyState > 0) {
            vid1.currentTime = vid2.currentTime;
        }
    };
    
    // 在绘制循环中也进行同步检查
    var lastSyncTime = 0;
    function checkSyncInDraw() {
        var now = Date.now();
        if (now - lastSyncTime > 100) { // 每100ms检查一次同步
            syncVideos();
            lastSyncTime = now;
        }
    }

    function drawLoop() {
        // 在绘制循环中检查同步和播放状态
        checkSyncInDraw();
        
        // 确保两个视频都在播放
        if (vid1.paused && !vid2.paused && vid1.readyState > 3) {
            vid1.play().catch(function(err) {
                console.log('Left video auto-play error:', err);
            });
        } else if (!vid1.paused && vid2.paused && vid2.readyState > 3) {
            vid2.play().catch(function(err) {
                console.log('Right video auto-play error:', err);
            });
        }
        
        var colStart = (vidWidth * position).clamp(0.0, vidWidth);
        var rightWidth = vidWidth - colStart;
        
        // 左边显示视频A：从视频A的左侧开始，显示到colStart位置
        if (colStart > 0) {
            mergeContext.drawImage(vid1, 0, 0, colStart, vidHeight, 0, 0, colStart, vidHeight);
        }
        
        // 右边显示视频B：从视频B的对应位置开始（colStart位置），显示剩余部分
        if (rightWidth > 0) {
            mergeContext.drawImage(vid2, colStart, 0, rightWidth, vidHeight, colStart, 0, rightWidth, vidHeight);
        }

        // Draw slider border
        mergeContext.beginPath();
        mergeContext.moveTo(vidWidth * position, 0);
        mergeContext.lineTo(vidWidth * position, vidHeight);
        mergeContext.closePath();
        mergeContext.strokeStyle = "#AAAAAA";
        mergeContext.lineWidth = 5;
        mergeContext.stroke();

        // Draw arrow/circle
        var arrowLength = 0.09 * vidHeight;
        var arrowheadWidth = 0.025 * vidHeight;
        var arrowheadLength = 0.04 * vidHeight;
        var arrowPosY = vidHeight / 10;
        var arrowWidth = 0.007 * vidHeight;
        var currX = vidWidth * position;

        // Draw circle
        mergeContext.beginPath();
        mergeContext.arc(currX, arrowPosY, arrowLength * 0.7, 0, Math.PI * 2, false);
        mergeContext.fillStyle = "#FFD79340";
        mergeContext.fill();

        // Draw arrow
        mergeContext.beginPath();
        mergeContext.moveTo(currX, arrowPosY - arrowWidth / 2);
        mergeContext.lineTo(currX + arrowLength / 2 - arrowheadLength / 2, arrowPosY - arrowWidth / 2);
        mergeContext.lineTo(currX + arrowLength / 2 - arrowheadLength / 2, arrowPosY - arrowheadWidth / 2);
        mergeContext.lineTo(currX + arrowLength / 2, arrowPosY);
        mergeContext.lineTo(currX + arrowLength / 2 - arrowheadLength / 2, arrowPosY + arrowheadWidth / 2);
        mergeContext.lineTo(currX + arrowLength / 2 - arrowheadLength / 2, arrowPosY + arrowWidth / 2);
        mergeContext.lineTo(currX - arrowLength / 2 + arrowheadLength / 2, arrowPosY + arrowWidth / 2);
        mergeContext.lineTo(currX - arrowLength / 2 + arrowheadLength / 2, arrowPosY + arrowheadWidth / 2);
        mergeContext.lineTo(currX - arrowLength / 2, arrowPosY);
        mergeContext.lineTo(currX - arrowLength / 2 + arrowheadLength / 2, arrowPosY - arrowheadWidth / 2);
        mergeContext.lineTo(currX - arrowLength / 2 + arrowheadLength / 2, arrowPosY - arrowWidth / 2);
        mergeContext.lineTo(currX, arrowPosY - arrowWidth / 2);
        mergeContext.closePath();
        mergeContext.fillStyle = "#AAAAAA";
        mergeContext.fill();

        requestAnimationFrame(drawLoop);
    }

    function startPlaying() {
        // 移除之前可能存在的监听器
        if (timeUpdateHandler) {
            vid2.removeEventListener('timeupdate', timeUpdateHandler);
        }
        if (seekedHandler) {
            vid2.removeEventListener('seeked', seekedHandler);
        }

        // 初始化时，将两个视频都重置到开头（时间0）
        vid1.currentTime = 0;
        vid2.currentTime = 0;

        function playBoth() {
            var playPromise1 = vid1.play().catch(function(err) {
                console.log('Left video initial play error:', err);
                return null;
            });
            var playPromise2 = vid2.play().catch(function(err) {
                console.log('Right video initial play error:', err);
                return null;
            });

            Promise.all([playPromise1, playPromise2]).finally(function() {
                // 确保时间同步
                vid1.currentTime = vid2.currentTime;

                // 添加事件监听器
                vid2.addEventListener('timeupdate', timeUpdateHandler);
                vid2.addEventListener('seeked', seekedHandler);

                // 启动绘制循环
                requestAnimationFrame(drawLoop);

                // 保险：200ms 后检查左侧是否仍暂停
                setTimeout(function() {
                    if (vid1.paused && !vid2.paused && vid1.readyState >= 3) {
                        vid1.play().catch(function(err) {
                            console.log('Left video retry play error:', err);
                        });
                    }
                }, 200);
            });
        }

        playBoth();
    }

    if (vid1.readyState > 3 && vid2.readyState > 3) {
        startPlaying();
    } else {
        var checkReady = function() {
            if (vid1.readyState > 3 && vid2.readyState > 3) {
                startPlaying();
            }
        };
        vid1.addEventListener('loadeddata', checkReady);
        vid2.addEventListener('loadeddata', checkReady);
    }
}

function resizeAndPlayTwo(element1, element2, canvasId) {
    var cv = document.getElementById(canvasId);
    var vid1 = document.getElementById(element1);
    var vid2 = document.getElementById(element2);
    
    function setupCanvas() {
        if (vid1.videoWidth > 0 && vid2.videoWidth > 0) {
            // 设置 canvas 的内部绘制尺寸为视频的实际尺寸
            cv.width = vid1.videoWidth;
            cv.height = vid1.videoHeight;
            
            // 如果 canvas 有 CSS 指定的显示宽度，计算并设置显示高度以保持宽高比
            var computedStyle = window.getComputedStyle(cv);
            var displayWidth = computedStyle.width;
            if (displayWidth && displayWidth !== 'auto' && displayWidth !== '0px') {
                var displayWidthNum = parseFloat(displayWidth);
                if (displayWidthNum > 0 && displayWidthNum !== vid1.videoWidth) {
                    var aspectRatio = vid1.videoHeight / vid1.videoWidth;
                    cv.style.width = displayWidthNum + 'px';
                    cv.style.height = (displayWidthNum * aspectRatio) + 'px';
                }
            }
            
            vid1.style.display = "none";
            vid2.style.display = "none";
            playTwoVids(element1, element2, canvasId);
        }
    }
    
    if (vid1.readyState > 3 && vid2.readyState > 3) {
        setupCanvas();
    } else {
        vid1.addEventListener('loadedmetadata', setupCanvas);
        vid2.addEventListener('loadedmetadata', setupCanvas);
        vid1.load();
        vid2.load();
    }
}
