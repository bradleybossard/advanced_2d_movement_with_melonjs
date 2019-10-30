game.PlayerEntity = me.Entity.extend({
    init: function(x, y, settings) {
        // call the constructor
        this._super(me.Entity, "init", [x, y , settings]);

        // player can exit the viewport (jumping, falling into a hole, etc.)
        this.alwaysUpdate = true;

        // walking & jumping speed
        //this.body.setMaxVelocity(6, 15);
        //this.body.setFriction(0.4, 0);

        this.dying = false;

        this.lastCollision = 0

        this.standing = false
        this.dashing = false
        this.movingX = false 
        this.movingY = false
        this.walkingwall = false
        this.stuck = false

        // set the viewport to follow this renderable on both axis, and enable damping
        me.game.viewport.follow(this, me.game.viewport.AXIS.BOTH, 0.1);

        // set a renderable
        this.renderable = game.texture.createAnimationFromName([
            "blob0000.png",
            "blob0001.png", "blob0002.png", "blob0003.png", "blob0004.png", "blob0005.png",
       
            "blob-dash0000.png", "blob-dash0001.png","blob-dash0002.png", "blob-dash0003.png","blob-dash0004.png",

            "blob-jump0000.png", "blob-jump0001.png","blob-jump0002.png", "blob-jump0003.png","blob-jump0004.png","blob-jump0005.png",

            "blob-up-wall0000.png", 
            "blob-up-wall0001.png", 
            "blob-up-wall0002.png", 
            "blob-up-wall0003.png", 
            "blob-up-wall0004.png",

        ]);

        // define a basic walking animatin
        this.renderable.addAnimation ("idle",  [0]);
        this.renderable.addAnimation ("walk",  [1,2,3,4,5]);
        this.renderable.addAnimation ("dash",  [8])
        this.renderable.addAnimation ("jump",  [11,12,13,14,15,16])
        this.renderable.addAnimation ("walk-wall",  [17,18,19,20,21])
        //this.renderable.addAnimation ("walk",  [{ name: "walk0001.png", delay: 100 }, { name: "walk0002.png", delay: 100 }, { name: "walk0003.png", delay: 100 }]);
        // set as default
        this.renderable.setCurrentAnimation("idle");

  // enable keyboard
        me.input.bindKey(me.input.KEY.LEFT,  "left");
        me.input.bindKey(me.input.KEY.RIGHT, "right");
        me.input.bindKey(me.input.KEY.UP,    "jump", true);
        //me.input.bindKey(me.input.KEY.SPACE, "jump", true);
        me.input.bindKey(me.input.KEY.DOWN,  "down");

        //me.input.bindKey(me.input.KEY.A,     "left");
        me.input.bindKey(me.input.KEY.D,     "dash");
        //me.input.bindKey(me.input.KEY.W,     "jump", true);
        //me.input.bindKey(me.input.KEY.S,     "down");


        // set the renderable position to bottom center
        this.anchorPoint.set(0.5, 0.5);
    },
    setAnimation: function() {
        if(this.standing && !this.movingX && !this.dashing && !this.walkingwall) {
            this.animation = "idle"
            //console.log(this.animation)
            this.renderable.setCurrentAnimation(this.animation)
        }

        if(this.movingX && this.animation != "walk" && !this.dashing) {
            this.animation = "walk"
            //console.log(this.animation)
            this.renderable.setCurrentAnimation(this.animation)
        }

        if(this.movingY && !this.falling && !this.walkingwall) {
            this.animation = "jump"
            //console.log(this.animation)
            this.renderable.setCurrentAnimation(this.animation)
        }
        if(this.dashing && this.animation != "dash"){
            this.animation = "dash"
            ////console.log(this.animation)
            this.renderable.setCurrentAnimation(this.animation)
        }

        if(this.walkingwall && this.animation != "walk-wall") {
            this.animation = "walk-wall"
            //console.log(this.animation)
            this.renderable.setCurrentAnimation(this.animation)
        }

    },

    moveRight: function(extra) {
        extra = extra || 0
        this.body.force.x = this.body.maxVel.x + extra;
        this.renderable.flipX(false);
    },
    moveLeft: function(extra) {
        extra = extra || 0
        this.body.force.x = -(this.body.maxVel.x + extra);
        this.renderable.flipX(true);
    },
    stopDash: function() {
        this.dashing = false
        if(this.body){
            this.body.force.x = 0
            if(!this.walkingwall) {
                this.body.setMaxVelocity(6, 16)
            } else {
                this.body.force.x = 10
                //this.body.setMaxVelocity(6, 2)
            }
        }
        me.sys.gravity = 0.98

       //console.log("DONE DASHING")
    },
    dash: function() {
        if(this.dashTimeout) clearTimeout(this.dashTimeout) 
        this.dashing = true
        this.body.setMaxVelocity(20, 0)
        if(this.renderable._flip.x) {
            this.body.force.x = -this.body.maxVel.x
        } else {
            this.body.force.x = this.body.maxVel.x
        }
        this.body.force.y = this.body.maxVel.y
        
        me.sys.gravity = false
        //console.log("DASHING!")
        
        this.dashTimeout = setTimeout(this.stopDash.bind(this), 500)
    },
    jump: function() {
        if(!this.walkingwall) {
            this.body.jumping = true;
            me.audio.play("jump", false);
        }  else {
            console.log("Going up the wall with vel: ", this.body.maxVel.y)
        }
        this.body.force.y = -this.body.maxVel.y 
    },
    moveDown: function() {
        this.body.jumping = false
        this.body.force.y = this.body.maxVel.y
    },
    update: function(dt) {

        let diff = ((new Date()).getTime() - this.lastCollision)
        const maxDiff = 400


        //If we've collided with the last walking wall for more than -maxDiff- milliseconds
        //and that was the last thing we collided with, we're pushing the player just a bit...
        if(diff > maxDiff && this.walkingwall) {
            this.body.gravity.y = 0.98
            this.body.setMaxVelocity(4,0)
            this.body.force.x = this.body.maxVel.x
            this.body.force.y = 0
        }
        

        //if we're colliding with a walkable wall and we haven't yet gotten "stuck"
        //we set -stuck- to TRUE and if we were dashing, we stop it.
        if(this.walkingwall && !this.stuck) {
            this.dashing = false
            this.stuck = true
            if(this.dashing) {
                clearTimeout(this.dashTimeout)
                this.stopDashing()
            }
        }
        
        //while walking through the wall, we set he correct properties for velocity and friction
        if(this.walkingwall && diff <= maxDiff ) {
            this.body.gravity.y = 0.1 
            this.body.setMaxVelocity(2, 3)
            this.body.setFriction(0.1, 2)
        } else {//otherwise, we go back to normal
            if(!this.dashing) {
                this.body.setMaxVelocity(6, 15)
                this.body.setFriction(0.4, 0);
            }

            this.body.gravity.y = 0.98
        }


        if(this.body.force.y < 0 && !this.dashing) {
            this.standing = false
            this.body.force.y += this.body.gravity.y
            this.body.force.y = Math.round(this.body.force.y * 100) / 100
        }
        //console.log("Y vel: ", this.body.force.y)
        //console.log("Wall walking: ", this.walkingwall, "max vel: ", this.body.maxVel.y, "gravity: ", this.body.gravity.y)
        
        if(this.body.force.x < 0) {
            this.body.force.x += this.body.friction.x
            this.body.force.x = Math.round(this.body.force.x * 100) / 100
        }

        if(this.body.force.x > 0) {
            this.body.force.x -= this.body.friction.x
            this.body.force.x = Math.round(this.body.force.x * 100) / 100
        }


        this.falling = (this.body.force.y > 0 && this.body.force.y < 1) 
        this.movingX = this.body.force.x != 0 && !this.walkingwall
        this.movingY = this.body.force.y != 0 && !this.standing && !this.dashing

        //console.log("Walking up wall: ", this.walkingwall)

        if(me.input.isKeyPressed("right") && this.standing) {
            this.moveRight()
        }

        if(me.input.isKeyPressed("left") && this.standing) {
            this.moveLeft()
        }

        if(me.input.isKeyPressed("jump")) {
            this.jump()
        }
        if(me.input.isKeyPressed("dash")) {
            this.dash();
        }
        if(me.input.isKeyPressed("down")) {
            this.moveDown()
        }

        // apply physics to the body (this moves the entity)
        this.body.update(dt);
        this.setAnimation()
        // handle collisions against other shapes
        me.collision.check(this);


        // check if we fell into a hole
        if (!this.inViewport && (this.pos.y > me.video.renderer.getHeight())) {
            // if yes reset the game
            me.game.world.removeChild(this);
            me.game.viewport.fadeIn("#fff", 150, function(){
                me.audio.play("die", false);
                me.levelDirector.reloadLevel();
                me.game.viewport.fadeOut("#fff", 150);
            });
            return true;
        }


        // check if we moved (an "idle" animation would definitely be cleaner)
        if (this.body.vel.x !== 0 || this.body.vel.y !== 0 ||
            (this.renderable && this.renderable.isFlickering())
        ) {
            this._super(me.Entity, "update", [dt]);
            return true;
        }
        return false; 
    },

    /**
     * colision handler
     */
    onCollision : function (response, other) {

        switch (other.body.collisionType) {
            case me.collision.types.WORLD_SHAPE:

                this.walkingwall = other.type == "walkable"
                console.log("Collision walkable: ", this.walkingwall)
                if(other.type == "walkable" && other.pos.y <= this.pos.y) {
                    this.lastCollision = (new Date()).getTime()
                    return true
                } else {
                    this.standing = true
                }

                // Simulate a platform object
                if (other.type === "platform") {
                    if (this.body.falling &&
                        !me.input.isKeyPressed("down") &&
                        // Shortest overlap would move the player upward
                        (response.overlapV.y > 0) &&
                        // The velocity is reasonably fast enough to have penetrated to the overlap depth
                        (~~this.body.vel.y >= ~~response.overlapV.y)
                    ) {
                        // Disable collision on the x axis
                        response.overlapV.x = 0;
                        // Repond to the platform (it is solid)
                        return true;
                    }
                    // Do not respond to the platform (pass through)
                    return false;
                }

                // Custom collision response for slopes
                else if (other.type === "slope") {
                    // Always adjust the collision response upward
                    response.overlapV.y = Math.abs(response.overlap);
                    response.overlapV.x = 0;

                    // Respond to the slope (it is solid)
                    return true;
                }
                break;

            default:
                // Do not respond to other objects (e.g. coins)
                return false;
        }

        // Make the object solid
        return true;
    },


    /**
     * ouch
     */
    hurt : function () {
        if (!this.renderable.isFlickering())
        {
            this.renderable.flicker(750);
            // flash the screen
            me.game.viewport.fadeIn("#FFFFFF", 75);
            me.audio.play("die", false);
        }
    }
});
