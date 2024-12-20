
class Game {
    constructor(THREE, OrbitControls) {
        this.THREE = THREE;
        this.OrbitControls = OrbitControls;
        this.scene;
        this.player = {};
        this.renderer;
        this.camera;
        this.orbCtrl;
        this.clock = new THREE.Clock();
        this.container;
        this.container = document.createElement('div');
        document.body.appendChild(this.container);
        this.animations = {};
        const game = this;
        this.aniInit();
    }

    aniInit(){
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color("#D5D5D5");
        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 3000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('webgl-container').appendChild(this.renderer.domElement);

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial({ color: "#FFFFFF" });
        this.cube = new THREE.Mesh(geometry, material);

        const ambient = new THREE.AmbientLight(0xffffff, 1.5);
        const light = new THREE.DirectionalLight(0xffffff, 2);
        light.position.set(100, 200, 100);
        light.castShadow = true;
        light.shadow.mapSize.width = 4096;
        light.shadow.mapSize.height = 4096;
        light.shadow.camera.near = 0.5;
        light.shadow.camera.far = 1000;
        light.shadow.bias = -0.001; 
        light.shadow.camera.left = -1000;
        light.shadow.camera.right = 1000;
        light.shadow.camera.top = 1000;
        light.shadow.camera.bottom = -1000;
        
        this.shadow = light;
        //this.scene.add(this.cube);
        this.scene.add(light);
        this.scene.add(ambient);

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth,window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap; // 선명한 그림자 타입
        this.container.appendChild(this.renderer.domElement);

        var mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(5000,5000),
            new THREE.MeshPhongMaterial({color:0xffffff,depthWrite:false})
        );
            mesh.rotation.x = - Math.PI / 2;
            mesh.position.y = -1;
            mesh.receiveShadow = true;
            this.scene.add(mesh);
            
            var grid = new THREE.GridHelper(5000,50,0x000000,0x000000);
            grid.position.y = -30;
            grid.material.transparent = true;
            grid.material.opacity = 0.3;
            this.scene.add(grid);
            //this.camera.position.z = 50;

            const loader = new THREE.FBXLoader();
            const game = this;

           // 첫 번째 FBX 파일 로드 (mai_three.fbx)
           loader.load('./assets/girlaction.fbx', (object) => {
            object.mixer = new THREE.AnimationMixer(object);
            object.name = "girl";
            game.player.mixer = object.mixer;
            game.player.root = object.mixer.getRoot();
            console.log(object.mixer.getRoot());

            game.scene.add(object);
            object.position.set(0, 0, 0);
            object.scale.set(1, 1, 1);
            object.traverse(function(child){
                if(child.isMesh){
                    child.castShadow = true;
                }
            });
            game.player.object = new THREE.Object3D();

            game.scene.add(game.player.object);
            game.player.object.add(object);
            
            console.log(object.animations);
            console.log(object.animations[0].name);
            console.log(object.animations[1]);
         
            object.animations.forEach((element) => {
                console.log("로드된 애니메이션 이름:", element.name); // 애니메이션 이름 출력

                if (element.name.includes('idle')) {
                    game.animations.idle = element; // 0번 인덱스: 대기
                } else if (element.name.includes('run')) {
                    game.animations.run = element; // 1번 인덱스: 달리기
                } else if (element.name.includes('kick')) {
                    game.animations.kick = element; // 2번 인덱스: 공격
                } else if (element.name.includes('walk')) {
                    game.animations.walk = element; // 3번 인덱스: 걷기
                } else if (element.name.includes('backward')) {
                    game.animations.backward = element; // 4번 인덱스: 뒤로 걷기
                    console.log("backward 애니메이션이 로드되었습니다:", game.animations.backward);

                    // backward 애니메이션의 키프레임이 제대로 로드되었는지 확인
                     console.log("backward 애니메이션 트랙 수:", game.animations.backward.tracks.length);
                }
                
            });
            console.log("Animations 객체:", game.animations);
            game.nextAni(loader)
        });

        // 두 번째 FBX 파일 로드 (snow_three.fbx)
        loader.load('./assets/snow_three.fbx', (object) => {
            game.scene.add(object);
            object.position.set(1, -1, 0);  // 적절한 위치 설정
            object.scale.set(0.0005, 0.0005, 0.0005);
        });
        this.orbCtrl = new this.OrbitControls(this.camera, this.renderer.domElement);
        this.orbCtrl.target.set(0, 0, 0);
        this.orbCtrl.update();

        //this.animate();
    }
    nextAni(loader){
        const game = this;
        loader.load('./assets/girlaction.fbx', 
            function(object){
            game.selAction = "idle";
            game.Cameras();
            game.Coliders();
            game.GamePad = new GamePad({
                pc:game.playerCtrl,
                game:game
            });
                game.animate();
        });
    }
    set selAction(name){
        if (!this.animations[name]) {
            console.error(`Error: ${name} 애니메이션이 존재하지 않습니다.`);
            return;
        }
        const action = this.player.mixer.clipAction(this.animations[name]);
        this.player.mixer.stopAllAction(); 
        this.player.action = name;
        this.player.actionTime = Date.now();
        action.fadeIn(0.1);
        action.play();
    }
    changeAction(){
        this.selAction = 
            document.getElementById("changeAction").value;
    }

    animate() {
        const game = this;
        const dt = this.clock.getDelta();
        requestAnimationFrame(() => this.animate());
        this.cube.rotation.x += 0.01;
        this.cube.rotation.y += 0.01;
        if(this.player.mixer!==undefined)this.player.mixer.update(dt);
        if(this.shadow != undefined){
            this.shadow.position.x = this.player.object.position.x+50;
            this.shadow.position.y = this.player.object.position.y+100;
            this.shadow.position.z = this.player.object.position.z+-200;
            this.shadow.target = this.player.object;
        }
        if(this.player.action == "walk"){
            const walkTime = Date.now() - this.player.actionTime;
            if(walkTime>2000&&this.player.move.moveF>0){
                this.selAction = "run";
            }
        }

        if(this.player.move !== undefined) this.move(dt);

        if(this.player.camera !== undefined && this.player.camera.active != undefined){
           this.camera.position.lerp(this.player.camera.active.getWorldPosition(new THREE.Vector3()),1);

           const cameraPosition = this.player.object.position.clone();

           cameraPosition.y += 200;
           cameraPosition.x += 50;
          this.camera.lookAt(cameraPosition);
        }
        this.renderer.render(this.scene, this.camera);
    }
    Coliders(){
        let geometry = new THREE.BoxGeometry(300,300,300);
        let material = new THREE.MeshBasicMaterial({color:0xFF8000});
        this.colliders = [];
        const cube1 = new THREE.Mesh(geometry,material);
        cube1.position.set(0,150,1000);
        this.colliders.push(cube1);
        this.scene.add(cube1);

        geometry = new THREE.BoxGeometry(500,300,300);
        material = new THREE.MeshBasicMaterial({color:0xFFFF33});
        const cube2 = new THREE.Mesh(geometry,material);
        cube2.position.set(500,150,1000);
        this.colliders.push(cube2);
        this.scene.add(cube2);
    }
    move(dt) {
        const position = this.player.object.position.clone();
        let direction = new this.THREE.Vector3();
    
        // 이동 방향 설정: 앞으로 이동이면 정방향, 뒤로 이동이면 반대 방향
        if (this.player.move.moveF < 0) {
            this.player.object.getWorldDirection(direction);
            direction.negate(); // 뒤로 이동 시 방향 반대로 설정
        } else {
            this.player.object.getWorldDirection(direction);
        }
    
        const raycaster = new this.THREE.Raycaster(position, direction.normalize());
        let T_F = false;
    
        const colliders = this.colliders;
        if (colliders !== undefined) {
            const distance = raycaster.intersectObjects(colliders);
    
            if (distance.length > 0) {
                if (distance[0].distance < 100) {
                    T_F = true;
                }
            }
        }
    
        if (!T_F) {
            if (this.player.move) {
                const speed = (this.player.action === 'run') ? 500 : 200;
                const moveDirection = (this.player.move.moveF > 0) ? 1 : -1;
    
                // 이동 후 예상되는 위치 계산
                const deltaMove = dt * speed * moveDirection;
                this.player.object.translateZ(deltaMove);
    
                // 경계 값 설정 (평면의 범위: -2500 ~ 2500)
                const boundary = 2500;
    
                const position = this.player.object.position;
                if (position.x < -boundary) position.x = -boundary;
                if (position.x > boundary) position.x = boundary;
                if (position.z < -boundary) position.z = -boundary;
                if (position.z > boundary) position.z = boundary;
            }
        }
    
        // 회전 적용
        this.player.object.rotateY(this.player.move.moveTurn * dt);
    }
    playerCtrl(moveF, moveTurn) {
        if (moveF > 0.1) {
            if (this.player.action != "walk" && this.player.action != "run") {
                this.selAction = 'walk';
            }
        } else if (moveF < -0.1) {
            if (this.player.action != "backward") {
                this.selAction = "backward"; // 수정: 'backWard'로 애니메이션 선택
            }
        } else if (moveF == 0 && moveTurn == 0) {
            if (this.player.action != "idle") {
                this.selAction = "idle";
            }
            delete this.player.move;
        } else {
            this.player.move = { moveF, moveTurn };
        }
    }

    set activeCamera(object){
        this.player.camera.active = object;
    }

    Cameras(){
        const back = new THREE.Object3D();
        back.position.set(0,500,-700);
        back.parent = this.player.object;
        this.player.camera = {back};
        this.activeCamera = this.player.camera.back;
    }
}

