class Title {
  constructor(container) {
    this.container = container;
    this.init();
  }

  async init() {
    // Scene, Camera, Renderer 설정
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(0, 0, 0, 0, 0.1, 1000); // 초기값 (onResize에서 설정)
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);

    // 비디오 엘리먼트 생성
    this.video = document.createElement("video");
    this.video.src = "assets/title_vid.mp4"; // 비디오 파일 경로
    this.video.loop = true;
    this.video.muted = true; // 자동 재생을 위해 음소거
    this.video.play();

    // 비디오 텍스처 생성
    this.videoTexture = new THREE.VideoTexture(this.video);

    // PlaneGeometry 생성
    const material = new THREE.MeshBasicMaterial({
      map: this.videoTexture,
      color: new THREE.Color(1, 1, 1), // 기본 컬러
    });
    this.plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material); // 초기값 설정
    this.scene.add(this.plane);

    // 카메라 위치 설정
    this.camera.position.z = 1;

    // 리사이즈 이벤트 등록
    window.addEventListener("resize", this.onResize.bind(this));

    // 페이지 숨김/표시 이벤트 등록
    document.addEventListener("visibilitychange", this.handleVisibilityChange.bind(this));

    // 배경음악 추가
    await this.addBackgroundMusic();

     // 초기 화면 설정
     this.onResize();

    // 애니메이션 루프 시작
    this.animate();
  }

  async addBackgroundMusic() {
    // THREE.AudioListener 생성
    this.listener = new THREE.AudioListener();
    this.camera.add(this.listener);

    // THREE.Audio 생성
    this.backgroundSound = new THREE.Audio(this.listener);

    // AudioLoader를 사용하여 MP3 파일 로드
    const audioLoader = new THREE.AudioLoader();
    await audioLoader.loadAsync("bgm/beach_sound.mp3").then((buffer) => {
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

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;

    // 카메라 업데이트
    const viewSize = height / 2.5; // 화면 크기에 맞춘 스케일링
    this.camera.left = -viewSize * aspect;
    this.camera.right = viewSize * aspect;
    this.camera.top = viewSize;
    this.camera.bottom = -viewSize;
    this.camera.updateProjectionMatrix();

    // 렌더러 크기 업데이트
    this.renderer.setSize(width, height);

    // PlaneGeometry 업데이트
    const videoAspect = 16 / 9; // 비디오의 기본 가로:세로 비율
    let planeWidth, planeHeight;

    if (aspect > videoAspect) {
        // 가로가 더 긴 경우 (비율에 맞추어 상하 검은 여백 추가)
        planeWidth = width;
        planeHeight = width / videoAspect;
    } else {
        // 세로가 더 긴 경우 (비율에 맞추어 좌우 검은 여백 추가)
        planeWidth = height * videoAspect;
        planeHeight = height;
    }

    this.plane.geometry.dispose();
    this.plane.geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);

    // Plane 위치 설정 (중앙에 배치)
    this.plane.position.set(0, 0, 0);
}

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}
