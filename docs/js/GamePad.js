class GamePad{
    constructor(param){
        this.pc = param.pc;
        const padHole = document.createElement("div");
        padHole.style.cssText
        ="position:absolute; width:120px; height:120px; bottom:50px;"
        +"background:rgba(243,97,166,0.5); border:#353535 solid medium; border-radius:50%; left:50%;"
        const stick = document.createElement("div");
        stick.style.cssText="position:absolute; left:30px; top:30px; width:60px; height:60px; border-radius:50%; background:#FF00DD;"
        padHole.appendChild(stick);
        document.body.appendChild(padHole);
        this.domElement = stick;
        this.maxRadius = 60*60;
        this.game = param.game;
        this.location = {left:this.domElement.offsetLeft,top:this.domElement.offsetTop};
        const pad = this;
        if('ontouchstart' in window){
            this.domElement.addEventListener('touchstart',function(e)
            {
                e.preventDefault();
                pad.touch(e);
                e.stopPropagation();
            });
        }
        else{
            this.domElement.addEventListener('mousedown',function(e)
        {
            console.log(e);
            e.preventDefault();
            pad.touch(e);
            e.stopPropagation();
        });
        }
    }

    getMousePosition(e){
        let Xvalue = e.targetTouches ? e.targetTouches[0].pageX : e.clientX;
        let Yvalue = e.targetTouches ? e.targetTouches[0].pageY : e.clientY;
        return{x:Xvalue,y:Yvalue};
    }

    touch(event){
        this.offset = this.getMousePosition(event);
        const pad = this;
        if('ontouchstart' in window){
            document.ontouchmove = function(e){e.preventDefault(); pad.move(e);};
            document.ontouchend = function(e){e.preventDefault(); pad.up(e);};
        }else{
            document.onmousemove = function(e){event.preventDefault(); pad.move(e);};
            document.onmouseup = function(e){event.preventDefault(); pad.up(e);};
        }
    }
    move(event){
        const mouse = this.getMousePosition(event);
        let left = mouse.x - this.offset.x;
        let top = mouse.y - this.offset.y;
        const calLoc = left*left + top*top;
        if(calLoc>this.maxRadius){
            const result = Math.sqrt(calLoc);
            left/=result;
            top/=result;
            left*=60;
            top*=60;
        }
        this.domElement.style.top = `${top + this.location.top}px`;
        this.domElement.style.left = `${left + this.location.left}px`;
        const moveF = -(top-this.location.top+this.domElement.clientHeight/2)/60;
        const moveT = -(left-this.location.left+this.domElement.clientWidth/2)/60;
        this.pc.call(this.game,moveF,moveT);
    }

    up(){
        if('ontouchstart' in window){
            document.ontouchmove = null;
            document.touchend = null;
        }else{
            document.onmousemove = null;
            document.onmouseup = null;
        }
        this.domElement.style.top = `${this.location.top}px`;
        this.domElement.style.left = `${this.location.left}px`;
        this.pc.call(this.game,0,0);
    }
}