class Game {
    constructor(THREE) {
        this.THREE = THREE;
        //this.OrbitControls = OrbitControls;
        this.scene;
        this.player = {};
        this.selPlayer;
        this.renderer;
        this.camera;
        this.clock = new THREE.Clock();
        this.container = document.createElement('div');
        document.body.appendChild(this.container);
        this.animations = {};
        

        // 이동 사운드 생성
        this.walkSound = new Audio("bgm/walking_water.mp3");
        this.runSound = new Audio("bgm/walking_water.mp3");
        this.backwardSound = new Audio("bgm/walking_water.mp3");

        // 상어 사운드 추가
        this.sharkSound = new Audio("bgm/sharkmon.wav");

        // 승리 사운드 추가
        this.hornSound = new Audio("bgm/horn.mp3");

        // 반복 재생 설정
        [this.walkSound, this.runSound, this.backwardSound].forEach((sound) => {
            sound.loop = true;
            sound.volume = 1; // 볼륨 설정
        });

        // sharkSound 볼륨 설정 (필요 시)
        this.sharkSound.volume = 1;

        // hornSound 볼륨 설정 (필요 시)
         this.hornSound.volume = 1;

        // 배속 설정
        this.runSound.playbackRate = 1.5; // 1.5배 빠르게 설정
    }

    async aniInit() {
        const game = this;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color("#D5D5D5");
        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 50000);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap; // 선명한 그림자 타입

        this.container.appendChild(this.renderer.domElement);
        document.getElementById('webgl-container').appendChild(this.renderer.domElement);

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

        var mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(10000, 10000),
            new THREE.MeshPhongMaterial({ color: 0xffffff, depthWrite: false })
        );
        mesh.rotation.x = - Math.PI / 2;
        mesh.position.y = -1;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        const loader = new THREE.FBXLoader();
        //const game = this;

        // 첫 번째 FBX 파일 로드 (mai_three.fbx)
        loader.load(`./assets/${game.selPlayer}.fbx`, (object) => {
            object.mixer = new THREE.AnimationMixer(object);
            object.name = "girl";
            game.player.mixer = object.mixer;
            game.player.root = object.mixer.getRoot();
            console.log(object.mixer.getRoot());

            game.scene.add(object);
            object.position.set(0, 0, 0);
            if (game.selPlayer === "girlaction") {
                object.scale.set(1, 1, 1);
            }
            else {
                object.scale.set(30, 30, 30);
            }

            object.traverse(function (child) {
                if (child.isMesh) {
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

            object.animations.forEach((animation) => {
                if (animation.name.includes('idle')) game.animations.idle = animation;
                else if (animation.name.includes('walk')) game.animations.walk = animation;
                else if (animation.name.includes('run')) game.animations.run = animation;
                else if (animation.name.includes('backward')) game.animations.backward = animation;
            });
            console.log("Animations 객체:", game.animations);
            game.nextAni(loader)
        });

        // 배경음악 추가
        await this.gameBackgroundMusic();

        //키보드 이벤트 리스너
        this.addKeyboardControls();

        // 페이지 숨김/표시 이벤트 등록
        document.addEventListener("visibilitychange", this.handleVisibilityChange.bind(this));
    }

    async gameBackgroundMusic() {
        // THREE.AudioListener 생성
        this.listener = new THREE.AudioListener();
        this.camera.add(this.listener);

        // THREE.Audio 생성
        this.backgroundSound = new THREE.Audio(this.listener);

        // AudioLoader를 사용하여 MP3 파일 로드
        const audioLoader = new THREE.AudioLoader();
        await audioLoader.loadAsync("bgm/playing_games.mp3").then((buffer) => {
            this.backgroundSound.setBuffer(buffer);
            this.backgroundSound.setLoop(true); // 반복 재생
            this.backgroundSound.setVolume(0.9); // 볼륨 설정
            this.backgroundSound.play(); // 재생 시작
        });

        // AudioContext 상태 확인 및 재개
        const audioContext = this.listener.context;
        if (audioContext.state === "suspended") {
            window.addEventListener("click", async () => {
                await audioContext.resume();
                console.log("AudioContext 재개됨");
            });
        }
    }

    stopBackgroundMusic() {
        if (this.backgroundSound && this.backgroundSound.isPlaying) {
          this.backgroundSound.stop(); // 배경음악 정지
        }
      }

      handleVisibilityChange() {
        if (document.visibilityState === "hidden") {
          // 창이 숨겨졌을 때 배경음악 중지
          this.stopBackgroundMusic();
        } else if (document.visibilityState === "visible") {
          // 창이 다시 표시되었을 때 배경음악 재생
          if (!this.backgroundSound.isPlaying) {
            this.backgroundSound.play();
          }
        }
      }

    nextAni(loader) {
        const game = this;
        loader.load(`./assets/${game.selPlayer}.fbx`,
            function (object) {
                game.selAction = "idle";
                game.Cameras();
                game.Coliders(loader);
                game.GamePad = new GamePad({
                    pc: game.playerCtrl,
                    game: game
                });
                game.animate();
            });
    }
    set selAction(name) {
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

        // 사운드 처리
        this.stopAllSounds();
        if (name === 'walk') this.walkSound.play();
        else if (name === 'run') this.runSound.play();
        else if (name === 'backward') this.backwardSound.play();
    }

    changeAction() {
        this.selAction =
            document.getElementById("changeAction").value;
    }

    changePlayer() {
        const selectedPlayer = document.getElementById("changePlayer").value;
        if (selectedPlayer === "") {
            alert("캐릭터를 선택해주세요!"); // 선택하지 않았을 경우 경고
            return;
        }

        this.selPlayer = selectedPlayer;
        console.log(`선택된 캐릭터: ${this.selPlayer}`);
        this.aniInit(); // 새로운 캐릭터로 초기화
    }

    animate() {
        const game = this;
        const dt = this.clock.getDelta();

        if (this.player.mixer !== undefined) this.player.mixer.update(dt);
        if (this.shadow != undefined) {
            this.shadow.position.x = this.player.object.position.x + 50;
            this.shadow.position.y = this.player.object.position.y + 100;
            this.shadow.position.z = this.player.object.position.z + -200;
            this.shadow.target = this.player.object;
        }
        if (this.player.action == "walk") {
            const walkTime = Date.now() - this.player.actionTime;
            if (walkTime > 2000 && this.player.move.moveF > 0) {
                this.selAction = "run";
            }
        }

        if (this.player.move !== undefined) this.move(dt);

        if (this.player.camera !== undefined && this.player.camera.active != undefined) {
            this.camera.position.lerp(this.player.camera.active.getWorldPosition(new THREE.Vector3()), 1);

            const cameraPosition = this.player.object.position.clone();

            cameraPosition.y += 200;
            cameraPosition.x += 50;
            this.camera.lookAt(cameraPosition);
        }
        const enemy = game.enemy;
        for (let x = 0; x < enemy.length; x++) {
            this.enemy[x].lookAt(this.player.object.position);
            this.enemy[x].rotateY(Math.PI / 2);
            this.enemy[x].translateX(-7); //상어 속도
        }
        let live = this.rule();
        if (live) requestAnimationFrame(function () { game.animate(); });
        this.renderer.render(this.scene, this.camera);
    }

    rule() {
        let live = true;
        const position = this.player.object.position.clone();
    
        const raycaster = new this.THREE.Raycaster(position);
    
        const enemy = this.enemy;
        if (enemy !== undefined) {
            const distance = raycaster.intersectObjects(enemy);
    
            if (distance.length > 0 && distance[0].distance < 100) {
                // 상어 소리 재생
                if (this.sharkSound) {
                    this.sharkSound.currentTime = 0; // 시작 위치 초기화
                    this.sharkSound.play().catch((error) => {
                        console.error("Shark sound play failed:", error);
                    });
                }
                alert("상어한테 잡혔습니다.");
                live = false;
                location.reload();
            }
        }
    
        const ship = this.ship;
        if (ship !== undefined) {
            const distance = raycaster.intersectObjects(ship);
    
            if (distance.length > 0 && distance[0].distance < 200) {
                // 탈출 성공 사운드 재생
                if (this.hornSound) {
                    this.hornSound.currentTime = 0; // 시작 위치 초기화
                    this.hornSound.play().then(() => {
                        alert("탈출에 성공했습니다."); // 소리가 재생된 후 알럿창 표시
                        location.reload(); // 알럿창 확인 후 페이지 리로드
                    }).catch((error) => {
                        console.error("Horn sound play failed:", error);
                    });
                } else {
                    alert("탈출에 성공했습니다.");
                    location.reload();
                }
                live = false;
            }
        }
    
        return live;
    }

    Coliders(loader) {
        this.colliders = [];
        this.enemy = [];
        this.ship = [];

        //FBX 파일 로드 (바다 객체)
        loader.load('./assets/sea.fbx', (object) => {
            game.scene.add(object);
            object.position.y = -80;
            object.scale.x = 1;
            object.scale.y = 0.1;
            object.scale.z = 1;
        })
        for (let x = 0; x < 50; x++) {
            if (x % 2 === 0) {
                this.rock(loader, true)
                this.tree(loader, true)
                this.shark(loader, true, false)
            }
            else {
                this.rock(loader, false)
                this.tree(loader, false)
                this.shark(loader, false, true)
            }
        }

        for (let x = 0; x < 100; x++) {
            if (x % 2 === 0) {
                this.shark(loader, true, true)
            }
            else {
                this.shark(loader, false, false)
            }
        }

        // FBX 파일 로드 (ship 객체)
        loader.load('./assets/ship.fbx', (object) => {
            game.scene.add(object);

            const seaBoundary = {
                xMin: -5000, // 바다의 x 최소값
                xMax: 5000,  // 바다의 x 최대값
                zMin: -5000, // 바다의 z 최소값
                zMax: 5000   // 바다의 z 최대값
            };

            // 무작위 위치를 바다 경계 내에서 설정
            const posx = Math.random() * (seaBoundary.xMax - seaBoundary.xMin);
            const posz = Math.random() * (seaBoundary.zMax - seaBoundary.zMin);

            // 배의 위치를 설정
            object.position.set(posx, -800, posz); // 화면 중심 근처로 
            object.scale.set(0.9, 0.9, 0.9); // 크기를 키움

            object.traverse(function (child) {
                if (child.isMesh) {
                    game.ship.push(child);
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
        });
    }
    shark(loader, t_f, t_f2) {
        //FBX 파일 로드 (상어 객체)
        loader.load('./assets/shark.fbx', (object) => {
            let posx = 0;
            let posz = 0;
            if (t_f && !t_f2) {
                posx = Math.floor(Math.random() * 8000)
                posz = Math.floor(Math.random() * 8000)
            }
            else if (!t_f && t_f2) {
                posx = Math.floor(Math.random() * -8000)
                posz = Math.floor(Math.random() * 8000)
            }
            else if (!t_f && !t_f2) {
                posx = Math.floor(Math.random() * 8000)
                posz = Math.floor(Math.random() * -8000)
            }
            else {
                posx = Math.floor(Math.random() * -8000)
                posz = Math.floor(Math.random() * -8000)
            }
            game.scene.add(object);
            object.position.set(posx, -1750, posz);  // 적절한 위치 설정
            object.scale.set(0.7, 0.7, 0.7);
            object.traverse(function (child) {
                if (child.isMesh) {
                    game.enemy.push(child);
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
        })
    }

    rock(loader, t_f) {
        //FBX 파일 로드 (돌 객체)
        loader.load('./assets/rock.fbx', (object) => {
            let posx = 0;
            let posz = 0;
            if (t_f) {
                posx = Math.floor(Math.random() * 10000)
                posz = Math.floor(Math.random() * 10000)
            }
            else {
                posx = Math.floor(Math.random() * -10000)
                posz = Math.floor(Math.random() * -10000)
            }
            game.scene.add(object);
            object.position.set(posx, -150, posz);  // 적절한 위치 설정
            object.scale.set(0.3, 0.1, 0.3);
            object.traverse(function (child) {
                if (child.isMesh) {
                    game.colliders.push(child);
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
        })
    }
    tree(loader, t_f) {
        loader.load('./assets/tree.fbx', (object) => {
            let posx = 0;
            let posz = 0;
            if (t_f) {
                posx = Math.floor(Math.random() * 10000)
                posz = Math.floor(Math.random() * 10000)
            }
            else {
                posx = Math.floor(Math.random() * -10000)
                posz = Math.floor(Math.random() * -10000)
            }
            game.scene.add(object);
            object.position.x = posx;
            object.position.y = -400;
            object.position.z = posz;
            object.scale.x = 0.2;
            object.scale.y = 0.2;
            object.scale.z = 0.2;
            object.traverse(function (child) {
                if (child.isMesh) {
                    game.colliders.push(child);
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
        })
    }
    move(dt) {
        const speed = 700; // 이동 속도
        const rotationSpeed = 2.5 * dt; // 회전 속도
        const seaBoundary = {
            xMin: -10000, xMax: 10000,
            zMin: -10000, zMax: 10000
        }; // 바다

        if (this.player.move) {
            // 현재 캐릭터의 이동 방향 계산
            const direction = new this.THREE.Vector3(0, 0, -1);
            this.player.object.getWorldDirection(direction);

            // 충돌 감지
            const raycaster = new this.THREE.Raycaster(this.player.object.position.clone(), direction.normalize());
            let collisionDetected = false;

            const colliders = [...this.colliders]; // 돌과 나무 포함
            if (colliders.length > 0) {
                const intersections = raycaster.intersectObjects(colliders);
                if (intersections.length > 0 && intersections[0].distance < 200) {
                    collisionDetected = true; // 충돌 감지
                }
            }

            // 이동 처리
            if (!collisionDetected) {
                if (this.player.move.moveF !== 0) {
                    const moveVector = direction.multiplyScalar(speed * this.player.move.moveF * dt);
                    this.player.object.position.add(moveVector);
                }

                // 경계값 확인 후 위치 조정
                const position = this.player.object.position;
                if (position.x < seaBoundary.xMin) position.x = seaBoundary.xMin;
                if (position.x > seaBoundary.xMax) position.x = seaBoundary.xMax;
                if (position.z < seaBoundary.zMin) position.z = seaBoundary.zMin;
                if (position.z > seaBoundary.zMax) position.z = seaBoundary.zMax;

            }
            // 회전 처리
            if (this.player.move.moveTurn !== 0) {
                this.player.object.rotation.y += this.player.move.moveTurn * rotationSpeed;
            }
        }
    }

    stopAllSounds() {
        [this.walkSound, this.runSound, this.backwardSound].forEach((sound) => {
            sound.pause();
            sound.currentTime = 0;
        });
    }

    playerCtrl(moveF, moveTurn) {
        // 이동 상태 업데이트
        if (moveF !== 0 || moveTurn !== 0) {
            this.player.move = { moveF, moveTurn };

            // 이동 상태에 따라 애니메이션 설정
            if (moveF > 0) {
                if (this.player.action !== "walk" && this.player.action !== "run") {
                    this.selAction = "walk"; // 앞 이동 시
                }
            } else if (moveF < 0) {
                if (this.player.action !== "backward") {
                    this.selAction = "backward"; // 뒤 이동 시
                }
            }
        } else {
            // 이동 중단 시 대기 상태로 변경
            this.selAction = "idle";
            delete this.player.move;
        }
    }


    set activeCamera(object) {
        this.player.camera.active = object;
    }

    addKeyboardControls() {
        const moveState = { moveF: 0, moveTurn: 0 };

        document.addEventListener("keydown", (event) => {
            if (event.key === "w") moveState.moveF = 1; // 앞으로 이동
            if (event.key === "s") moveState.moveF = -1; // 뒤로 이동
            if (event.key === "a") moveState.moveTurn = 1; // 왼쪽 회전
            if (event.key === "d") moveState.moveTurn = -1; // 오른쪽 회전

            this.playerCtrl(moveState.moveF, moveState.moveTurn);
        });

        document.addEventListener("keyup", (event) => {
            if (event.key === "w" || event.key === "s") moveState.moveF = 0; // 이동 중단
            if (event.key === "a" || event.key === "d") moveState.moveTurn = 0; // 회전 중단

            this.playerCtrl(moveState.moveF, moveState.moveTurn);
        });
    }

    Cameras() {
        const back = new THREE.Object3D();
        back.position.set(0, 500, -700);
        back.parent = this.player.object;
        this.player.camera = { back };
        this.activeCamera = this.player.camera.back;
    }

}