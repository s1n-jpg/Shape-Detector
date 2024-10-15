document.getElementById('processButton').addEventListener('click', processImage);

function processImage() {
  const imgElement = document.getElementById('imageUpload').files[0];
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  const img = new Image();
  img.src = URL.createObjectURL(imgElement);
  
  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    let src = cv.imread(canvas);
    let gray = new cv.Mat();
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    
    // Convert to grayscale
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    
    // Apply thresholding
    cv.threshold(gray, gray, 120, 255, cv.THRESH_BINARY);
    
    // Find contours
    cv.findContours(gray, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
    
    let shapeCounts = {
      triangles: 0,
      squares: 0,
      rectangles: 0,
      circles: 0,
    };
    
    // Loop over contours
    for (let i = 0; i < contours.size(); ++i) {
      let contour = contours.get(i);
      let approx = new cv.Mat();
      
      // Approximate the contour
      cv.approxPolyDP(contour, approx, 0.04 * cv.arcLength(contour, true), true);
      
      // Get the bounding box of the shape to position the label
      let boundingRect = cv.boundingRect(contour);
      let centerX = boundingRect.x + boundingRect.width / 2;
      let centerY = boundingRect.y + boundingRect.height / 2;
      
      if (approx.rows === 3) {
        shapeCounts.triangles += 1;
        drawLabel(ctx, "Triangle", centerX, centerY);
      } else if (approx.rows === 4) {
        let rect = cv.boundingRect(contour);
        let aspectRatio = rect.width / rect.height;
        if (aspectRatio >= 0.9 && aspectRatio <= 1.1) {
          shapeCounts.squares += 1;
          drawLabel(ctx, "Square", centerX, centerY);
        } else {
          shapeCounts.rectangles += 1;
          drawLabel(ctx, "Rectangle", centerX, centerY);
        }
      } else {
        let area = cv.contourArea(contour);
        let perimeter = cv.arcLength(contour, true);
        let circularity = (4 * Math.PI * area) / (perimeter * perimeter);
        if (circularity > 0.8) {
          shapeCounts.circles += 1;
          drawLabel(ctx, "Circle", centerX, centerY);
        }
      }
      
      approx.delete();
    }
    
    src.delete();
    gray.delete();
    contours.delete();
    hierarchy.delete();
    
    displayResults(shapeCounts);
  };
}

// Function to display labels on the canvas next to detected shapes
function drawLabel(ctx, shapeName, x, y) {
  ctx.fillStyle = 'red';
  ctx.font = '18px Arial';
  ctx.fillText(shapeName, x - 20, y);  // Adjust the position of the text slightly
}

function displayResults(shapeCounts) {
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = `
    The image contains: <br>
    ${shapeCounts.triangles} Triangle(s)<br>
    ${shapeCounts.squares} Square(s)<br>
    ${shapeCounts.rectangles} Rectangle(s)<br>
    ${shapeCounts.circles} Circle(s)<br>
  `;
}
