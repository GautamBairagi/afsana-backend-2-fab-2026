 
export const responsePage = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Afsana Backend</title>
      <style>
        body {
          margin: 0;
          font-family: Arial, sans-serif;
          background: linear-gradient(135deg, rgb(207 207 245), rgb(165 159 159));;
          color: #48d165ff;
          display: flex;
          flex-direction: column;
          align-items: center;
           margin-top: 20px;
          height: 100vh;
        }
        .banner-image {
          width: 90%;
          text-align: center;
          background:linear-gradient(135deg, rgb(74 69 88), rgb(30 66 29));
          padding: 20px 0;
        }
        .banner-image img {
          width: 150px;
        }
        .welcome-text {
          margin-top: 40px;
          font-size: 28px;
          font-weight: bold;
          text-shadow: 1px 1px 4px rgba(0,0,0,0.5);
        }
      </style>
    </head>
    <body>
      <div class="banner-image">
       <img src="https://afsanaproject-production.up.railway.app/public/logo.png" alt="Afsana Logo" crossOrigin="anonymous">
      </div>
      <div class="welcome-text">
        Welcome to afsana back-end service...

        <a href="https://apply.studyfirstinfo.com/" style = "color: pink; text-decoration: none; font-size: 20px;">Go to Frontend</a>
      </div>
    </body>
    </html>
  `