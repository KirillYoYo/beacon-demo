const str = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
  <!-- Фон -->
  <rect width="400" height="300" fill="#1a1a2e"/>
  
  <!-- Круг через path -->
  <path d="M 100,40 A 60,60 0 1,1 100,160 A 60,60 0 1,1 100,40 Z" 
        fill="#373D52" stroke="#ffffff" stroke-width="3" stroke-linejoin="round"/>
  
  <!-- Квадрат через path -->
  <path d="M 200,40 L 300,40 L 300,140 L 200,140 L 200,40 Z" 
        fill="#4a5a7a" stroke="#ffffff" stroke-width="3" stroke-linejoin="round"/>
  
  <!-- Треугольник через path -->
  <path d="M 320,170 L 270,240 L 370,240 Z" 
        fill="#2d3b55" stroke="#ffffff" stroke-width="3" stroke-linejoin="round"/>
 
</svg>

`

export default str