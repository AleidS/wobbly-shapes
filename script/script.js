window.addEventListener('load', function () {

    function createPath() {
        $('.roundedContainer').each(function (i) {

            // If div is not currently being displayed, ignore it
            if ($(this).css('display') == 'none') {
                return
            }

            // Store all corners of all inner divs

            allCorners = []

            $(this).find("div").each(function (i) {

                // Get all coordinates for each corner
                if ($(this).hasClass('exclude')) {
                    return
                }
                var styles = window.getComputedStyle(this);
                var marginRight = 0;
                var marginLeft = 0;
                var marginTop = 0;
                var marginBottom = 0;

                // Consider margins and borders
                marginTop = parseFloat(styles['marginTop']);
                marginBottom = parseFloat(styles['marginBottom']);
                marginLeft = parseFloat(styles['marginLeft'])
                marginRight = parseFloat(styles['marginRight'])
                borderTop = parseFloat(styles['borderTopWidth']);
                borderBottom = parseFloat(styles['borderBottomWidth']);
                borderLeft = parseFloat(styles['borderLeftWidth'])
                borderRight = parseFloat(styles['borderRightWidth'])

                // Borders dont work -> to use borders, use following CSS on inner divs:
                // box - sizing: border - box;
                // -moz - box - sizing: border - box;
                // -webkit - box - sizing: border - box;
                borderTop = 0;
                borderBottom = 0;
                borderLeft = 0;
                borderRight = 0;

                // Width and height of the individual divs
                height = this.offsetHeight
                width = this.offsetWidth

                // If div has no height or width, ignore its points
                if ($(this).css('display') == 'none' || height + marginTop + marginBottom == 0 || width + marginLeft + marginRight == 0) {
                    return
                }
                // console.log(width, height)

                // Store all the points of each div 
                //(4 per div, so this only works with rectangular divs)
                topLeft = {
                    div: i,
                    name: this.getAttribute('class'),
                    corner: 1,
                    x: this.offsetLeft - marginLeft - borderLeft,
                    y: this.offsetTop - marginTop - borderTop
                }
                bottomLeft = {
                    div: i,
                    name: this.getAttribute('class'),
                    corner: 2,
                    x: this.offsetLeft - marginLeft - borderLeft,
                    y: this.offsetTop + height + marginBottom + borderBottom
                }
                bottomRight = {
                    div: i,
                    name: this.getAttribute('class'),
                    corner: 3,
                    x: this.offsetLeft + width + marginRight + borderRight,
                    y: this.offsetTop + height + marginBottom + borderBottom
                }
                topRight = {
                    div: i,
                    name: this.getAttribute('class'),
                    corner: 4,
                    x: this.offsetLeft + width + marginRight + borderRight,
                    y: this.offsetTop - marginTop - borderTop
                }
                allCorners.push(topLeft, bottomLeft, bottomRight, topRight)
                // console.log(topLeft, bottomLeft, bottomRight, topRight);
            })
            // console.log(allCorners)

            clipPath = []

            function generateClipPath() {

                // This clip path will start at a point, then consider the next point on that div (counter clockwise),
                // It will then check if there are no other points (from other divs) at the same line, 
                //that come before the next point on the div. (meaning the other div is adjacent to this one, 
                //and we will go around that one first instead)


                // We start with the points at the left, 
                //and then the one at the top (it's a bit arbritrary, could start anywhere). 
                //Find left-most point ->
                minimum = Math.min(...allCorners.map(item => item.x))
                //Filter out the left-most points
                leftMost = allCorners.filter((point) => point.x == minimum)
                //From these points, take the highest point (y coord)
                topLeftPoint = Math.min(...leftMost.map(item => item.y))
                // Take the first point if there are multiple
                firstPoint = allCorners.filter((point) => (point.x == minimum && point.y == topLeftPoint))[0]
                clipPath.push(firstPoint)


                //Get the next points, in the right order-> 
                // (this is a recursive function that continues untill we are back at the starting point)
                function nextPoint(prevPoint) {
                    //See what the next point on the div is, going counter clockwise 
                    //(refer to the definitions of corner 1,2,3,4 above)
                    let nextCorner = prevPoint.corner + 1

                    if (prevPoint.corner == 4) {
                        nextCorner = 1
                    }

                    let nextDivPoint = allCorners.filter((point) => (
                        point.div == prevPoint.div &&
                        point.corner == nextCorner
                    ))[0]


                    // Now check if theres not another point before this point on the same line
                    // or in other words: if theres not a div adjacent to the current one, 
                    //that we want to include in our shape.

                    //To check the direction, first check if two points are on a horizontal or vertical line

                    horizontal = nextDivPoint.y == prevPoint.y
                    vertical = nextDivPoint.x == prevPoint.x

                    // Check precise direction
                    toRight = nextDivPoint.x > prevPoint.x
                    toLeft = nextDivPoint.x < prevPoint.x
                    up = nextDivPoint.y < prevPoint.y
                    down = nextDivPoint.y > prevPoint.y

                    let followingPoint = {}

                    // if on horizontal line, check if there's other points with this same Y coordinate on that line 

                    if (horizontal) {
                        allPointsOnLine = allCorners.filter((point) => (
                            point.y == nextDivPoint.y && //Point should be on same horizontal line as the next div point (so same y)
                            (clipPath.indexOf(point) == -1 || //Should not be a point that we have already considered
                                (point == firstPoint && //UNLESS it's the first point
                                    prevPoint != firstPoint && //However, we don't want to go straight back to the first point from the second point
                                    clipPath.slice(-3, -2)[0].y != firstPoint.y)))) //Or if the point before prevpoint, was on the same vertical line as the first point, 
                        //                                                          in which case we are just making a line rather than a shape

                        if (toLeft) {
                            // console.log('left')
                            // If we have determined we are going left, 
                            // check if there are points on this line, that have a larger X than the nextPoint (meaning we encounter them before our next point)
                            // Exclude the current point
                            largerXs = allPointsOnLine.filter((point) => (point.x > nextDivPoint.x && (point != prevPoint)))
                            if (largerXs.length > 0) {
                                largestX = Math.max(...largerXs.map(item => item.x))
                                // If this largest X is even larger than the previous point, this means we are going in opposite direction,
                                // in that case, take the point closest to the  previous point
                                if (largestX > prevPoint.X) {
                                    largerThanPrev = largerXs.filter((point) => (point.x >= prevPoint.x))
                                    followingPoint = largerThanPrev.sort((a, b) =>
                                        Math.abs(prevPoint.X - a) - Math.abs(prevPoint.X - b)
                                    )[0]
                                }
                                else {
                                    // Else, just take the largest point on the line (which is again closest to prev point)
                                    followingPoint = largerXs.filter((point) => (point.x == largestX))[0]
                                }
                            }
                            else {
                                followingPoint = nextDivPoint
                            }
                        }
                        if (toRight) {
                            // Repeat this trick , but everything opposite if we are going to right
                            // console.log('right')
                            smallerXs = allPointsOnLine.filter((point) => (point.x < nextDivPoint.x && (point != prevPoint)))
                            // console.log(smallerXs)
                            if (smallerXs.length > 0) {
                                smallestX = Math.min(...smallerXs.map(item => item.x))
                                if (smallestX < prevPoint.X) {
                                    smallerThanPrev = smallerXs.filter((point) => (point.x <= prevPoint.x))
                                    followingPoint = smallerXs.sort((a, b) =>
                                        Math.abs(prevPoint.X - a) - Math.abs(prevPoint.X - b)
                                    )[0]
                                }
                                else {
                                    followingPoint = smallerXs.filter((point) => (point.x == smallestX))[0]
                                }
                            }
                            else {
                                followingPoint = nextDivPoint
                            }
                        }
                    }
                    // Same for vertical line
                    if (vertical) {
                        allPointsOnLine = allCorners.filter((point) => (point.x == nextDivPoint.x && (clipPath.indexOf(point) == -1 || (point == firstPoint && prevPoint != firstPoint && clipPath.slice(-3, -2)[0].x != firstPoint.x))))

                        if (down) {
                            // console.log('down')
                            smallerYs = allPointsOnLine.filter((point) => (point.y < nextDivPoint.y && (point != prevPoint)))
                            // console.log(smallerYs);
                            if (smallerYs.length > 0) {


                                smallestY = Math.min(...smallerYs.map(item => item.y))

                                if (smallestY < prevPoint.Y) {
                                    smallerThanPrev = smallerYs.filter((point) => (point.y <= prevPoint.y))
                                    followingPoint = smallerYs.sort((a, b) =>
                                        Math.abs(prevPoint.y - a) - Math.abs(prevPoint.y - b)
                                    )[0]
                                }
                                else {
                                    // else, just take the smallest point on the line
                                    followingPoint = smallerYs.filter((point) => (point.y == smallestY))[0]
                                }
                            }
                            else {
                                followingPoint = nextDivPoint
                            }
                        }
                        if (up) {
                            // console.log('up')
                            largerYs = allPointsOnLine.filter((point) => (point.y > nextDivPoint.y && (point != prevPoint)))
                            if (largerYs.length > 0) {
                                largestY = Math.max(...largerYs.map(item => item.y))
                                if (largestY > prevPoint.y) {
                                    largerThanPrev = largerYs.filter((point) => (point.y >= prevPoint.y))
                                    followingPoint = largerThanPrev.sort((a, b) =>
                                        Math.abs(prevPoint.y - a) - Math.abs(prevPoint.y - b)
                                    )[0]
                                }
                                else {
                                    followingPoint = largerYs.filter((point) => (point.y == largestY))[0]
                                }
                            }
                            else {
                                followingPoint = nextDivPoint
                            }
                        }

                    }
                    // console.log(followingPoint)

                    // Add the point we found to the clip path 

                    // If we are now back at the first point, we are done
                    if (followingPoint == firstPoint) {
                        clipPath.push(followingPoint)
                        return
                    }
                    // The clip path should not have more points than there are corners,
                    // if so, you get an error, and you most likely have an infinite loop, 
                    //where it never gets back to the first corner.
                    //To solve, console log the clip path to see how it's moving
                    else if (clipPath.length < (allCorners.length + 1)) {
                        clipPath.push(followingPoint)
                        nextPoint(followingPoint)
                    }
                    else {
                        console.log(clipPath)
                        alert('Something went wrong generating shapes on the site. Console for more information')
                    }
                }
                nextPoint(firstPoint)
            }
            generateClipPath()

            // console.log(clipPath)
            let clipPathString = ""
            let polygonString = ""


            // this one is for clip paths, can only mask one shape
            function genClipPathString(clipPath) {
                clipPath.forEach((element, i) => {
                    if (i != clipPath.length - 1) {
                        clipPathString = clipPathString.concat(element.x + 'px ' + element.y + 'px ' + ',')
                    }
                    else (
                        clipPathString = clipPathString.concat(element.x + 'px ' + element.y + 'px ')
                    )
                }
                )
            }
            // this one is for svg/polygons, could add more shapes in the future
            function genPolygonString(clipPath) {
                clipPath.forEach((element, i) => {
                    if (i != clipPath.length - 1) {
                        polygonString = polygonString.concat(element.x + ',' + element.y + ' ')
                    }
                    else (
                        polygonString = polygonString.concat(element.x + ',' + element.y)
                    )
                }
                )
            }
            // If parent div has a border radius, 
            // apply this to cut-out as well
            // Implement: Percentage support
            if ($(this).css('border-radius') != null) {
                let borderRadius = $(this).css('border-radius')
                borderRadius = parseFloat(borderRadius.replace(/\D/g, ''));
                // console.log(borderRadius)

                // For each 3 points, if the last 3 points are on the same div, we want a normal border radius
                // if they are not, we want an inverted border radius. 

                //Idea is to add ~100 point on each corner in a quarter circle, 
                //radius depening on border radius of original div.

                let newClipPath = []

                let clipPathCopy = clipPath
                // Remove the last element as it is the same as the first
                clipPathCopy.pop()

                //Now iterate through all elements
                clipPathCopy.forEach((element, i) => {

                    let el1
                    let el2
                    let el3

                    // Point before 
                    if (i > 0) {
                        el1 = clipPath[i - 1]
                    }
                    else {
                        el1 = clipPath[clipPath.length - 1]
                    }

                    // Current point
                    el2 = element

                    // Point after
                    if (i < clipPath.length - 1) {
                        el3 = clipPath[i + 1]
                    }
                    else {
                        el3 = clipPath[0]
                    }

                    // How much are we going in each direction
                    deltaX = el3.x - el1.x
                    deltaY = el3.y - el1.y

                    // console.log(deltaX, deltaY)
                    let borderXDelta = deltaX > 0 ? borderRadius : -borderRadius
                    let borderYDelta = deltaY > 0 ? borderRadius : -borderRadius

                    // If border radius is bigger than half the space between points, make delta smaller
                    if (Math.abs(deltaX) < (Math.abs(borderXDelta) * 2)) {
                        borderXDelta = deltaX / 2
                    }
                    if (Math.abs(deltaY) < Math.abs(borderYDelta) * 2) {
                        borderYDelta = deltaY / 2
                    }

                    // Horizontal or vertical?
                    horizontal = el1.y == el2.y
                    vertical = el1.x == el2.x


                    // Create 2 points in between we want the curved border
                    // distance between them is determined by border radius, 
                    // unless we don't have that amount of space
                    newStartPoint = {}
                    newEndPoint = {}

                    if (vertical) {
                        newStartPoint.x = el2.x
                        newStartPoint.y = el2.y - borderYDelta
                        newEndPoint.x = el2.x + borderXDelta
                        newEndPoint.y = el2.y

                    }
                    if (horizontal) {
                        newStartPoint.x = el2.x - borderXDelta
                        newStartPoint.y = el2.y
                        newEndPoint.x = el2.x
                        newEndPoint.y = el2.y + borderYDelta
                    }

                    // From: https://stackoverflow.com/questions/20353677/drawing-a-smooth-curved-arc-between-two-points

                    // Now generate 100 points in between start and end point, on a curve 
                    plot_curve(newStartPoint.x, newStartPoint.y, newEndPoint.x, newEndPoint.y)
                    function plot_curve(x, y, xx, yy) {
                        // console.log('hey')
                        var startX = x;
                        var startY = y;

                        var endX = xx;
                        var endY = yy;

                        var bezierX = x;  // x1
                        var bezierY = yy; // y2

                        var t;

                        if (horizontal) {
                            var bezierX = xx;  // x1
                            var bezierY = y; // y2
                            for (t = 0.0; t <= 1; t += 0.01) {
                                let newPoint = {}
                                newPoint.x = ((1 - t) * (1 - t) * startX + 2 * (1 - t) * t * bezierX + t * t * endX);
                                newPoint.y = ((1 - t) * (1 - t) * startY + 2 * (1 - t) * t * bezierY + t * t * endY);
                                newClipPath.push(newPoint)
                            }
                        }
                        if (vertical) {
                            for (t = 0.0; t <= 1; t += 0.01) {
                                let newPoint = {}
                                newPoint.x = ((1 - t) * (1 - t) * startX + 2 * (1 - t) * t * bezierX + t * t * endX);
                                newPoint.y = ((1 - t) * (1 - t) * startY + 2 * (1 - t) * t * bezierY + t * t * endY);
                                newClipPath.push(newPoint)
                            }
                        }
                    }
                })
                genClipPathString(newClipPath)
                genPolygonString(newClipPath)
            }

            // polygons = [0, 1]
            // polygonList = []
            // polygons.forEach((polygon) =>

            //     polygonList.push(
            //         `<polygon points(${polygon})`
            //     ))
            index = i
            width = $(this).width()
            height = $(this).height()

            $(this).css('clip-path', `url(#clipPath${index})`)
            $(this).css('-webkit-clip-path', `url(#clipPath${index})`)


            addToBody = `
                <svg xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <clipPath id="clipPath${index}">
                            <polygon points="${polygonString}" />
                        </clipPath>
                    </defs>
                </svg>
                `
            // If there is no svg container for this element yet, create one
            // console.log($(`.svgContainer${index}`).length)
            if ($(`.svgContainer${index}`).length != 1) {
                var child = document.createElement('div');
                child.innerHTML = (addToBody)
                child.className = `svgContainer${index}`
                document.body.appendChild(child)
            }
            else {
                document.getElementsByClassName(`svgContainer${index}`)[0].innerHTML = addToBody;

            }

        })
    }
    createPath()

    window.addEventListener('resize', function () {
        createPath()
    })
    $('.B').on('click', function () {
        createPath()
    })

    let radiusSlider = $('#borderRadiusSlider')[0]
    radiusSlider.addEventListener('input', e => {
        $('.roundedContainer').css('border-radius', e.target.value + 'px')
        createPath()
    })
    let marginSlider = $('#marginSlider')[0]
    marginSlider.addEventListener('input', e => {
        $('.A,.B').css('margin-bottom', e.target.value + 'px')
        // $('.A,.B').css('margin-top', e.target.value + 'px')
        createPath()
    })
    let positionSlider = $('#positionSlider')[0]
    positionSlider.addEventListener('input', e => {
        $('.B').css('left', e.target.value + 'px')
        createPath()
    })
    heightSlider.addEventListener('input', e => {
        $('.B').css('height', e.target.value + 'px')
        createPath()
    })
    widthSlider.addEventListener('input', e => {
        $('.F').css('width', e.target.value + 'px')
        createPath()
    })

    $('#resizeMe').on('resize', function () {
        createPath();
    })
    $('#resizeMe').resizable({
        handles: 'n,w,s,e',
        // minWidth: 200,
        // maxWidth: 400
    });
})

