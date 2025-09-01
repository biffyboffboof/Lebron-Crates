import * as THREE from 'three';
import { state } from './state';
import { getElement } from './utils';

let scene, camera, renderer, crate, clock, particles, rarityLight;
let animationFrameId;
let coinScene, coinCamera, coinRenderer, coin, coinClock;
let coinAnimationFrameId;

const rarityColors = {
  common: 0x9e9e9e,
  rare: 0x4caf50,
  epic: 0x9c27b0,
  legendary: 0xffc107,
  lebron: 0xf44336,
};

const crateColorMap = {
    basic: 0x8B4513,
    rare: rarityColors.rare,
    epic: rarityColors.epic,
    legendary: rarityColors.legendary,
};

const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function playLebronRevealAnimation() {
    let isSkipped = false;
    const modal = getElement('crate-modal');
    const animationContainer = getElement('animation-container');

    const overlay = document.createElement('div');
    overlay.className = 'lebron-reveal-overlay';
    const slash = document.createElement('div');
    slash.className = 'lebron-slash';
    const revealContainer = document.createElement('div');
    revealContainer.className = 'lebron-reveal-container';
    const aura = document.createElement('div');
    aura.className = 'lebron-aura';
    const icon = document.createElement('div');
    icon.className = 'lebron-icon';
    icon.textContent = '👑';
    revealContainer.append(aura, icon);
    modal.append(overlay, slash, revealContainer);

    const skip = () => { isSkipped = true; };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            skip();
        }
    };
    
    modal.addEventListener('click', skip);
    document.addEventListener('keydown', handleKeyDown);

    const cleanUp = () => {
        overlay.remove();
        slash.remove();
        revealContainer.remove();
        document.body.classList.remove('screen-shake');
        modal.removeEventListener('click', skip);
        document.removeEventListener('keydown', handleKeyDown);
    };

    try {
        animationContainer.classList.add('hidden');
        overlay.style.transition = 'opacity 0.5s ease-in-out';
        overlay.style.opacity = '1';
        await waitFor(500); if (isSkipped) throw 'skipped';
        slash.classList.add('animate');
        document.body.classList.add('screen-shake');
        await waitFor(400); if (isSkipped) throw 'skipped';
        document.body.classList.remove('screen-shake');
        await waitFor(400); if (isSkipped) throw 'skipped';
        document.body.classList.add('screen-shake');
        await waitFor(400); if (isSkipped) throw 'skipped';
        document.body.classList.remove('screen-shake');
        await waitFor(100); if (isSkipped) throw 'skipped';
        revealContainer.style.transition = 'opacity 1s ease-in, transform 1s ease-in';
        revealContainer.style.opacity = '1';
        revealContainer.style.transform = 'translate(-50%, -50%) scale(1)';
        await waitFor(2500); if (isSkipped) throw 'skipped';
        overlay.style.transition = 'opacity 0.5s ease-out';
        revealContainer.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
        overlay.style.opacity = '0';
        revealContainer.style.transform = 'translate(-50%, -50%) scale(0.8)';
        await waitFor(500);
    } catch (e) {
        if (e !== 'skipped') throw e;
    } finally {
        cleanUp();
    }
}

function initCrate(crateType, resultRarity) {
    const container = getElement('animation-container');
    if (!container) return;
    container.innerHTML = '';
    clock = new THREE.Clock();
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 5;
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(0, 5, 5);
    scene.add(pointLight);
    crate = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.MeshStandardMaterial({ color: crateColorMap[crateType] || 0x8B4513, roughness: 0.6, metalness: 0.3 })
    );
    scene.add(crate);
    rarityLight = new THREE.PointLight(rarityColors[resultRarity] || 0xffffff, 0, 10);
    rarityLight.position.set(0, 0, 0);
    scene.add(rarityLight);
}

function createParticles(rarity) {
    const particleCount = 150;
    particles = new THREE.Group();
    const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const particleMaterial = new THREE.MeshBasicMaterial({ color: rarityColors[rarity], transparent: true, opacity: 1 });
    for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());
        particle.position.set(0, 0, 0);
        const phi = Math.random() * Math.PI * 2;
        const costheta = Math.random() * 2 - 1;
        const theta = Math.acos(costheta);
        const speed = 0.5 + Math.random() * 0.5;
        (particle as any).velocity = new THREE.Vector3(
            speed * Math.sin(theta) * Math.cos(phi),
            speed * Math.sin(theta) * Math.sin(phi),
            speed * Math.cos(theta)
        );
        particles.add(particle);
    }
    scene.add(particles);
}

export function playCrateOpenAnimation(crateType, resultRarity) {
    if (resultRarity === 'lebron') {
        return playLebronRevealAnimation();
    }
    return new Promise<void>(resolve => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        initCrate(crateType, resultRarity);
        let particlesCreated = false;
        const container = getElement('animation-container');
        
        let handleKeyDown;

        const skipAnimation = (e?: MouseEvent) => {
            if (e) {
                e.stopPropagation();
                e.preventDefault();
            }
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            container.removeEventListener('click', skipAnimation);
            document.removeEventListener('keydown', handleKeyDown);
            resolve();
        };

        handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                skipAnimation();
            }
        };

        container.addEventListener('click', skipAnimation);
        document.addEventListener('keydown', handleKeyDown);

        const startTime = clock.getElapsedTime();
        const duration = 4.0;
        function animate() {
            const elapsedTime = clock.getElapsedTime() - startTime;
            if (elapsedTime > duration) {
                skipAnimation();
                return;
            }
            const shakePhaseDuration = duration * 0.6;
            const explosionPhaseDuration = duration * 0.4;
            if (elapsedTime < shakePhaseDuration) {
                const shakeProgress = elapsedTime / shakePhaseDuration;
                crate.rotation.y += 0.05;
                crate.rotation.x += 0.03;
                crate.position.x = Math.sin(elapsedTime * 30) * 0.1 * shakeProgress;
                crate.position.y = Math.sin(elapsedTime * 25) * 0.1 * shakeProgress + (shakeProgress * 0.5);
                rarityLight.intensity = 5 * shakeProgress * shakeProgress;
            } else {
                if (!particlesCreated) {
                    crate.visible = false;
                    rarityLight.intensity = 20;
                    createParticles(resultRarity);
                    particlesCreated = true;
                }
                const explosionProgress = (elapsedTime - shakePhaseDuration) / explosionPhaseDuration;
                rarityLight.intensity = 20 * (1 - explosionProgress);
                if (particles) {
                    particles.children.forEach(p => {
                        p.position.add((p as any).velocity.clone().multiplyScalar(0.1));
                        (p as any).material.opacity = 1 - explosionProgress;
                    });
                }
            }
            renderer.render(scene, camera);
            animationFrameId = requestAnimationFrame(animate);
        }
        animate();
    });
}

function createCoinTexture(text, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Cannot get 2d context');
    context.fillStyle = '#FFD700'; // Gold
    context.beginPath();
    context.arc(128, 128, 128, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#DAA520'; // Goldenrod
    context.lineWidth = 10;
    context.stroke();
    context.font = 'bold 150px sans-serif';
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, 128, 128);
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 16;
    return texture;
}

function initCoinFlip() {
    const container = getElement('coin-flip-animation-container');
    container.innerHTML = '';
    coinClock = new THREE.Clock();
    coinScene = new THREE.Scene();
    coinCamera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    coinCamera.position.set(0, 2, 6);
    coinCamera.lookAt(0, 0, 0);
    coinRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    coinRenderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(coinRenderer.domElement);
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    coinScene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(5, 10, 7.5);
    coinScene.add(directional);
    const coinMaterialProps = { metalness: 0.8, roughness: 0.3 };
    const materials = [
        new THREE.MeshStandardMaterial({ color: 0xB87333, ...coinMaterialProps }), // Edge
        new THREE.MeshStandardMaterial({ map: createCoinTexture('H', '#A67C00'), ...coinMaterialProps }), // Top (Heads)
        new THREE.MeshStandardMaterial({ map: createCoinTexture('T', '#A67C00'), ...coinMaterialProps }), // Bottom (Tails)
    ];
    const geometry = new THREE.CylinderGeometry(1.5, 1.5, 0.2, 64);
    coin = new THREE.Mesh(geometry, materials);
    coinScene.add(coin);
}

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

export function playCoinFlipAnimation(result) {
    return new Promise<void>(resolve => {
        if (coinAnimationFrameId) cancelAnimationFrame(coinAnimationFrameId);
        initCoinFlip();
        const duration = 3.0;
        const startTime = coinClock.getElapsedTime();
        const startY = -2.5;
        const peakY = 2.5;
        const finalY = 0;
        const totalSpinsX = 5;
        const targetRotationX = result === 'heads' ? 0 : Math.PI;
        const finalRotationX = totalSpinsX * 2 * Math.PI + targetRotationX;
        const totalSpinsY = 2;
        const finalRotationY = totalSpinsY * 2 * Math.PI + (Math.random() * Math.PI);
        function animate() {
            const elapsedTime = coinClock.getElapsedTime() - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const easedProgress = easeOutCubic(progress);
            const A = 2 * finalY - 4 * peakY + 2 * startY;
            const B = finalY - startY - A;
            coin.position.y = A * progress * progress + B * progress + startY;
            coin.rotation.x = easedProgress * finalRotationX;
            coin.rotation.y = easedProgress * finalRotationY;
            coin.rotation.z = 0; // Keep it clean, no z-wobble
            coinRenderer.render(coinScene, coinCamera);
            if (progress >= 1) {
                setTimeout(() => {
                    cancelAnimationFrame(coinAnimationFrameId);
                    coinAnimationFrameId = null;
                    resolve();
                }, 500); // Wait half a second on the result
                return;
            }
            coinAnimationFrameId = requestAnimationFrame(animate);
        }
        animate();
    });
}