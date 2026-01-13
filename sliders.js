const slides = document.querySelectorAll(".slide");
const nextBtn = document.querySelector(".next");
const prevBtn = document.querySelector(".prev");

let index = 0;

function showSlide(i) {
    slides.forEach(slide => slide.classList.remove("active"));
    slides[i].classList.add("active");
}

nextBtn.onclick = () => {
    index = (index + 1) % slides.length;
    showSlide(index);
};

prevBtn.onclick = () => {
    index = (index - 1 + slides.length) % slides.length;
    showSlide(index);
};

// Auto slide every 5 seconds
setInterval(() => {
    index = (index + 1) % slides.length;
    showSlide(index);
}, 5000);