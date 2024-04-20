@import url('https://fonts.googleapis.com/css2?family=Zeyada&display=swap');




body {
    height: 100 vh;
    display: flex;
    align - items: center;
    justify - content: center;

    background - size: 1000 px;
    background - image: url("https://www.psdgraphics.com/wp-content/uploads/2022/01/white-math-paper-texture.jpg");
    background - position: center center;
}

.paper {
    background - image: url("https://i0.wp.com/textures.world/wp-content/uploads/2018/10/2-Millimeter-Paper-Background-copy.jpg?ssl=1");
    background - size: 500 px;
    background - position: center center;
    padding: 20 px 100 px;
    /*  min-width: 800px; */

    transform: rotateZ(-5 deg);
    box - shadow: 1 px 15 px 20 px 0 px rgba(0, 0, 0, 0.5);

    position: absolute;
}

.paper.heart {
        position: relative;
        width: 200 px;
        height: 200 px;
        padding: 0;
        border - radius: 50 % ;
    }

    .paper.image {
        padding: 10 px;
    }
    .paper.image p {
        font - size: 30 px;
    }

img {
    max - height: 200 px;
    width: 100 % ;
    user - select: none;
}

.paper.heart::after {
    content: "";
    background - image: url('https://cdn.pixabay.com/photo/2016/03/31/19/25/cartoon-1294994__340.png');
    width: 100 % ;
    height: 100 % ;
    position: absolute;
    top: 0;
    left: 0;
    background - size: 150 px;
    background - position: center center;
    background - repeat: no - repeat;
    opacity: 0.6;
}

p {
    font - family: 'Zeyada';
    font - size: 50 px;
    color: rgb(0, 0, 100);
    opacity: 0.75;
    user - select: none;

    // filter: drop-shadow(2px 1.5px 1px rgba(0,0,105,0.9));
}