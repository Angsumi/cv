/**
 * Angsuman Das - Academic Portfolio & CV
 * Ultra-Smooth Canvas Frame-Sequence Engine
 * 100% Pure Vanilla JavaScript (0 External Frameworks)
 * 
 * Non-linear scroll timing:
 * - The opening boy sequence (Frames 1-48) plays rapidly and finishes strictly within the Hero section.
 * - The remaining genetic ribbon & globe sequence (Frames 48-150) smoothly unfolds across the rest of the site.
 */

// =============================================================================
// 1. CANVAS FRAME-SEQUENCE ENGINE (MULTI-STAGE NON-LINEAR MAPPING)
// =============================================================================
const canvas = document.getElementById("bgScrollCanvas");
const ctx = canvas ? canvas.getContext("2d") : null;
const hudPhaseName = document.getElementById("hudPhaseName");
const hudProgressBar = document.getElementById("hudProgressBar");
const heroSection = document.getElementById("hero");

const TOTAL_FRAMES = 117;
const HERO_END_FRAME = 75;       // Frame 75: initial phase ends smoothly within Hero
const EDUCATION_FRAME = 116;     // Frame 117 (0-indexed 116): Education section and end frame
const frames = [];
let loadedCount = 0;
let currentFrameIndex = 0;
let targetFrameIndex = 0;

// Format frame index to 4-digit string: 1 -> "0001"
function getFramePath(index) {
    const numStr = String(index).padStart(4, "0");
    return `assets/frames/frame_${numStr}.webp`;
}

// Canvas resize & drawing logic - uncropped full viewport display
function drawFrame(img) {
    if (!ctx || !canvas || !img || !img.complete || img.naturalWidth === 0) return;

    const w = window.innerWidth;
    const h = window.innerHeight;

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, w, h);
}

// Preload Engine: Priority load initial frames then stream remaining up to 117
function initFramePreloader() {
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
        const img = new Image();
        img.src = getFramePath(i);

        img.onload = () => {
            loadedCount++;
            if (i === 1 && currentFrameIndex === 0) {
                drawFrame(img);
            }
        };

        frames.push(img);
    }
}

// Piecewise Scroll Frame Mapping (Capped strictly at Frame 117):
function updateScrollFrame() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const heroHeight = heroSection ? heroSection.offsetHeight : window.innerHeight;
    const eduEl = document.getElementById("education");
    const eduOffset = eduEl ? eduEl.offsetTop - 80 : heroHeight;
    const eduHeight = eduEl ? eduEl.offsetHeight : window.innerHeight;

    if (scrollHeight <= 0) return;

    const totalScrollFraction = Math.min(Math.max(scrollTop / scrollHeight, 0), 1);
    const rapidThreshold = heroHeight * 0.65;

    if (scrollTop <= rapidThreshold) {
        // Stage 1: Transition through initial frames (0 -> 75)
        const heroFraction = Math.min(Math.max(scrollTop / rapidThreshold, 0), 1);
        targetFrameIndex = heroFraction * HERO_END_FRAME;
    } else if (scrollTop <= eduOffset + eduHeight * 0.5) {
        // Stage 2: Advances to and reaches Frame 117 at the Education section
        const progressToEdu = Math.min(Math.max((scrollTop - rapidThreshold) / Math.max(eduOffset - rapidThreshold + 1, 1), 0), 1);
        targetFrameIndex = HERO_END_FRAME + (progressToEdu * (EDUCATION_FRAME - HERO_END_FRAME));
    } else {
        // Stage 3: Locks on Frame 117 across any further page scrolling
        targetFrameIndex = EDUCATION_FRAME;
    }

    // Ensure bounds strictly within [0, TOTAL_FRAMES - 1]
    targetFrameIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, targetFrameIndex));

    // Update HUD Progress
    if (hudProgressBar) {
        hudProgressBar.style.width = (totalScrollFraction * 100).toFixed(1) + "%";
    }
}

// Silky Smooth Canvas Render Loop
function renderCanvasLoop() {
    // Highly responsive damping factor
    const diff = targetFrameIndex - currentFrameIndex;
    if (Math.abs(diff) > 0.05) {
        currentFrameIndex += diff * 0.35; // fast, instant response
    } else {
        currentFrameIndex = targetFrameIndex;
    }

    const frameIdx = Math.round(currentFrameIndex);
    const safeIdx = Math.max(0, Math.min(TOTAL_FRAMES - 1, frameIdx));
    const activeImg = frames[safeIdx];

    if (activeImg && activeImg.complete && activeImg.naturalWidth > 0) {
        drawFrame(activeImg);
    }

    // Section: Education appears on 117th Frame (Index >= 116)
    const eduEl = document.getElementById("education");
    if (eduEl) {
        if (safeIdx >= 116) {
            eduEl.classList.add("frame-117-active");
        } else {
            eduEl.classList.remove("frame-117-active");
        }
    }

    requestAnimationFrame(renderCanvasLoop);
}

// High-DPI Canvas Resolution Sizing
function resizeCanvas() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    if (ctx) ctx.scale(dpr, dpr);

    const safeIdx = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(currentFrameIndex)));
    if (frames[safeIdx]) {
        drawFrame(frames[safeIdx]);
    }
}

window.addEventListener("resize", () => {
    resizeCanvas();
    updateScrollFrame();
});

window.addEventListener("scroll", updateScrollFrame, { passive: true });

// Start Frame Engine
initFramePreloader();
resizeCanvas();
requestAnimationFrame(renderCanvasLoop);

// =============================================================================
// 2. SECTION PHASE TRACKER & ACTIVE NAV SPY
// =============================================================================
const sections = document.querySelectorAll("header[data-phase], section[data-phase]");
const navbar = document.getElementById("navbar");
const backToTopBtn = document.getElementById("backToTop");
let prevScrollY = window.pageYOffset;

window.addEventListener("scroll", () => {
    const currentScrollY = window.pageYOffset;

    // Back to top visibility
    if (backToTopBtn) {
        if (currentScrollY > 400) {
            backToTopBtn.classList.add("visible");
        } else {
            backToTopBtn.classList.remove("visible");
        }
    }

    // Hide/Show Navbar on Scroll
    if (navbar) {
        if (currentScrollY > 120 && prevScrollY < currentScrollY) {
            navbar.style.transform = "translateY(-100%)";
        } else {
            navbar.style.transform = "translateY(0)";
        }
    }
    prevScrollY = currentScrollY;

    // Section Phase & Nav Highlighting
    let activePhase = "RESEARCHER ORIGIN";
    let activeSectionId = "";

    sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.45 && rect.bottom >= window.innerHeight * 0.2) {
            const phase = section.getAttribute("data-phase");
            if (phase) activePhase = phase;
            activeSectionId = section.getAttribute("id") || "";
        }
    });

    if (hudPhaseName) {
        hudPhaseName.textContent = activePhase;
    }

    // Nav active link styling
    if (activeSectionId) {
        document.querySelectorAll(".nav-links a").forEach(link => {
            link.classList.remove("active");
            if (link.getAttribute("href") === `#${activeSectionId}`) {
                link.classList.add("active");
            }
        });
    }
}, { passive: true });

if (backToTopBtn) {
    backToTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

// =============================================================================
// 3. TYPEWRITER EFFECT
// =============================================================================
const typewriterPhrases = [
    "Computational Genomics",
    "Structural Bioinformatics",
    "Zoology & Biochemistry",
    "Genomic Data Science",
    "Homology Modeling",
    "Ecological Data Analysis"
];

let phraseIdx = 0;
let charIdx = 0;
let isDeleting = false;
const typewriterEl = document.getElementById("typewriterText");
const typeSpeed = 95;
const delSpeed = 45;
const holdDelay = 2000;

function runTypewriter() {
    if (!typewriterEl) return;

    const currentPhrase = typewriterPhrases[phraseIdx];

    if (isDeleting) {
        typewriterEl.textContent = currentPhrase.substring(0, charIdx - 1);
        charIdx--;
    } else {
        typewriterEl.textContent = currentPhrase.substring(0, charIdx + 1);
        charIdx++;
    }

    let nextStepDelay = isDeleting ? delSpeed : typeSpeed;

    if (!isDeleting && charIdx === currentPhrase.length) {
        nextStepDelay = holdDelay;
        isDeleting = true;
    } else if (isDeleting && charIdx === 0) {
        isDeleting = false;
        phraseIdx = (phraseIdx + 1) % typewriterPhrases.length;
        nextStepDelay = 400;
    }

    setTimeout(runTypewriter, nextStepDelay);
}

document.addEventListener("DOMContentLoaded", () => {
    runTypewriter();
    updateScrollFrame();
});

// =============================================================================
// 4. SMOOTH SCROLLING & MOBILE NAVIGATION
// =============================================================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#' || !targetId) return;

        const targetEl = document.querySelector(targetId);
        if (targetEl) {
            e.preventDefault();
            const navOffset = navbar ? navbar.offsetHeight : 70;
            const targetPos = targetEl.getBoundingClientRect().top + window.pageYOffset - navOffset;

            window.scrollTo({
                top: targetPos,
                behavior: 'smooth'
            });

            // Close mobile menu if open
            const navLinks = document.getElementById('navLinks');
            if (navLinks && navLinks.classList.contains('mobile-active')) {
                navLinks.classList.remove('mobile-active');
            }
        }
    });
});

const mobileToggle = document.getElementById('mobileToggle');
const navLinks = document.getElementById('navLinks');

if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
        navLinks.classList.toggle('mobile-active');
    });
}

// =============================================================================
// 5. PUBLICATION LIVE SEARCH & FILTER (PURE JS)
// =============================================================================
function filterPublications() {
    const input = document.getElementById("pubSearch");
    if (!input) return;
    const query = input.value.toLowerCase().trim();
    const items = document.querySelectorAll("#publicationsList .publication-item");
    let matchCount = 0;

    items.forEach(item => {
        const title = item.querySelector("h3") ? item.querySelector("h3").innerText.toLowerCase() : "";
        const abstract = item.querySelector(".pub-abstract") ? item.querySelector(".pub-abstract").innerText.toLowerCase() : "";
        const tags = item.getAttribute("data-tags") ? item.getAttribute("data-tags").toLowerCase() : "";

        if (title.includes(query) || abstract.includes(query) || tags.includes(query)) {
            item.style.display = "flex";
            matchCount++;
        } else {
            item.style.display = "none";
        }
    });

    const pubCount = document.getElementById("pubCount");
    if (pubCount) {
        pubCount.textContent = `Showing ${matchCount} of ${items.length} Papers`;
    }
}

// =============================================================================
// 6. CONTACT MODAL & COPY TO CLIPBOARD
// =============================================================================
const contactBtn = document.getElementById('contactBtn');
const themeContactBtn = document.getElementById('themeContactBtn');
const contactModal = document.getElementById('contactModal');
const closeModal = document.getElementById('closeModal');

function openContactModal(e) {
    if (e) e.preventDefault();
    if (contactModal) contactModal.classList.add('active');
}

function closeContactModalFunc() {
    if (contactModal) contactModal.classList.remove('active');
}

if (contactBtn) contactBtn.addEventListener('click', openContactModal);
if (themeContactBtn) themeContactBtn.addEventListener('click', openContactModal);
const navContactTrigger = document.getElementById('navContactTrigger');
if (navContactTrigger) navContactTrigger.addEventListener('click', openContactModal);
document.querySelectorAll('.rail-contact-trigger').forEach(el => el.addEventListener('click', openContactModal));
if (closeModal) closeModal.addEventListener('click', closeContactModalFunc);

if (contactModal) {
    contactModal.addEventListener('click', (e) => {
        if (e.target === contactModal) {
            closeContactModalFunc();
        }
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && contactModal && contactModal.classList.contains('active')) {
        closeContactModalFunc();
    }
});

function copyText(text, btn) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            const originalHtml = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i>';
            btn.style.color = '#10b981';
            setTimeout(() => {
                btn.innerHTML = originalHtml;
                btn.style.color = '';
            }, 1800);
        }).catch(() => fallbackCopy(text, btn));
    } else {
        fallbackCopy(text, btn);
    }
}

function fallbackCopy(text, btn) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i>';
        btn.style.color = '#10b981';
        setTimeout(() => {
            btn.innerHTML = originalHtml;
            btn.style.color = '';
        }, 1800);
    } catch (err) {
        console.error("Fallback copy failed", err);
    }
    document.body.removeChild(textArea);
}

// =============================================================================
// 7. INTERSECTION OBSERVER SCROLL REVEAL ANIMATIONS
// =============================================================================
const observerOptions = {
    threshold: 0.08,
    rootMargin: "0px 0px -30px 0px"
};

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
            revealObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.glass, .glass-heavy, .section-header, .stat-card, .timeline-item').forEach(el => {
    el.style.opacity = "0";
    el.style.transform = "translateY(24px)";
    el.style.transition = "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)";
    revealObserver.observe(el);
});
