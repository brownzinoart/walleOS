document.addEventListener("DOMContentLoaded", () => {
	const slideTitles = [
		"3D Render",
		"Agriculture",
		"Wildlife",
		"Food",
		"Travel",
		"Sports",
		"Nature"
	];

	const slideDescriptions = [
		"Concept Art",
		"Wind Turbine",
		"Parent And Child",
		"Morning Breakfast",
		"Hiking",
		"Playing Tennis",
		"Rocky Mountains"
	];

	const imageUrls = [
		"https://images.unsplash.com/photo-1630692929609-1fbfb477602e?q=80&w=1915&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
		"https://images.unsplash.com/photo-1644046266854-8c8d45a6997d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
		"https://images.unsplash.com/photo-1586778538929-ee34a8e9d8e7?q=80&w=2074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
		"https://images.unsplash.com/photo-1550461716-dbf266b2a8a7?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
		"https://images.unsplash.com/photo-1682686578615-39549501dd08?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
		"https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
		"https://images.unsplash.com/photo-1468877294001-94aef5ebfa1e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
	];

	const totalSlides = imageUrls.length;
	let currentSlide = 1;
	let isAnimating = false;
	let scrollAllowed = true;
	let lastScrollTime = 0;

	function createSlide(slideNumber, direction) {
		const slide = document.createElement("div");
		slide.className = "slide";

		const slideBgImg = document.createElement("div");
		slideBgImg.className = "slide-bg-img";

		const img = document.createElement("img");
		img.src = imageUrls[slideNumber - 1];
		img.alt = slideDescriptions[slideNumber];

		slideBgImg.appendChild(img);
		slide.appendChild(slideBgImg);

		if (direction === "down") {
			slideBgImg.style.clipPath =
				"polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)";
		} else {
			slideBgImg.style.clipPath = "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)";
		}
		return slide;
	}

	function createMainImageWrapper(slideNumber, direction) {
		const wrapper = document.createElement("div");
		wrapper.className = "slide-main-img-wrapper";

		const img = document.createElement("img");
		img.src = imageUrls[slideNumber - 1];
		img.alt = slideDescriptions[slideNumber];

		wrapper.appendChild(img);

		if (direction === "down") {
			wrapper.style.clipPath = "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)";
		} else {
			wrapper.style.clipPath = "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)";
		}
		return wrapper;
	}

	function createTextElements(slideNumber, direction) {
		const newTitle = document.createElement("h1");
		newTitle.textContent = slideTitles[slideNumber - 1];
		gsap.set(newTitle, {
			y: direction === "down" ? 50 : -50
		});

		const newDesc = document.createElement("p");
		newDesc.textContent = slideDescriptions[slideNumber - 1];
		gsap.set(newDesc, {
			y: direction === "down" ? 20 : -20
		});

		const newCounter = document.createElement("p");
		newCounter.textContent = slideNumber;
		gsap.set(newCounter, {
			y: direction === "down" ? 18 : -18
		});

		return { newTitle, newDesc, newCounter };
	}

	function animateSlide(direction) {
		if (isAnimating || !scrollAllowed) return;

		isAnimating = true;
		scrollAllowed = false;

		const slider = document.querySelector(".slider");
		const currentSlideElement = slider.querySelector(".slide");
		const mainImageContainer = document.querySelector(".slide-main-img");
		const currentMainWrapper = mainImageContainer.querySelector(
			".slide-main-img-wrapper"
		);

		const titleContainer = document.querySelector(".slide-title");
		const descContainer = document.querySelector(".slide-description");
		const counterContainer = document.querySelector(".count");

		const currentTitle = titleContainer.querySelector("h1");
		const currentDesc = descContainer.querySelector("p");
		const currentCounter = counterContainer.querySelector("p");

		if (direction === "down") {
			currentSlide = currentSlide === totalSlides ? 1 : currentSlide + 1;
		} else {
			currentSlide = currentSlide === 1 ? totalSlides : currentSlide - 1;
		}

		const newSlide = createSlide(currentSlide, direction);
		const newMainWrapper = createMainImageWrapper(currentSlide, direction);
		const { newTitle, newDesc, newCounter } = createTextElements(
			currentSlide,
			direction
		);

		slider.appendChild(newSlide);
		mainImageContainer.appendChild(newMainWrapper);
		titleContainer.appendChild(newTitle);
		descContainer.appendChild(newDesc);
		counterContainer.appendChild(newCounter);

		gsap.set(newMainWrapper.querySelector("img"), {
			y: direction === "down" ? "-50%" : "50%"
		});

		const tl = gsap.timeline({
			onComplete: () => {
				[
					currentSlideElement,
					currentMainWrapper,
					currentTitle,
					currentDesc,
					currentCounter
				].forEach((el) => el?.remove());

				isAnimating = false;

				setTimeout(() => {
					scrollAllowed = true;
					lastScrollTime = Date.now();
				}, 100);
			}
		});

		tl
			.to(
				newSlide.querySelector(".slide-bg-img"),
				{
					clipPath:
						direction === "down"
							? "polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)"
							: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
					duration: 1.25,
					ease: CustomEase.create("", ".87, 0, .13, 1")
				},
				0
			)
			.to(
				currentSlideElement.querySelector("img"),
				{
					scale: 1.5,
					duration: 1.25,
					ease: CustomEase.create("", ".87, 0, .13, 1")
				},
				0
			)
			.to(
				newMainWrapper,
				{
					clipPath:
						direction === "down"
							? "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)"
							: "polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)",
					duration: 1.25,
					ease: CustomEase.create("", ".87, 0, .13, 1")
				},
				0
			)
			.to(
				currentMainWrapper.querySelector("img"),
				{
					y: direction === "down" ? "50%" : "-50%",
					duration: 1.25,
					ease: CustomEase.create("", ".87, 0, .13, 1")
				},
				0
			)
			.to(
				newMainWrapper.querySelector("img"),
				{
					y: 0,
					duration: 1.25,
					ease: CustomEase.create("", ".87, 0, .13, 1")
				},
				0
			)
			.to(
				currentTitle,
				{
					y: direction === "down" ? -50 : 50,
					duration: 1.25,
					ease: CustomEase.create("", ".87, 0, .13, 1")
				},
				0
			)
			.to(
				newTitle,
				{
					y: 0,
					duration: 1.25,
					ease: CustomEase.create("", ".87, 0, .13, 1")
				},
				0
			)
			.to(
				currentDesc,
				{
					y: direction === "down" ? -20 : 20,
					duration: 1.25,
					ease: CustomEase.create("", ".87, 0, .13, 1")
				},
				0
			)
			.to(
				newDesc,
				{
					y: 0,
					duration: 1.25,
					ease: CustomEase.create("", ".87, 0, .13, 1")
				},
				0
			)
			.to(
				currentCounter,
				{
					y: direction === "down" ? -18 : 18,
					duration: 1.25,
					ease: CustomEase.create("", ".87, 0, .13, 1")
				},
				0
			)
			.to(
				newCounter,
				{
					y: 0,
					duration: 1.25,
					ease: CustomEase.create("", ".87, 0, .13, 1")
				},
				0
			);
	}

	function handleScroll(direction) {
		const now = Date.now();
		if (isAnimating || !scrollAllowed) return;
		if (now - lastScrollTime < 1000) return;
		lastScrollTime = now;
		animateSlide(direction);
	}

	window.addEventListener(
		"wheel",
		(e) => {
			e.preventDefault();
			const direction = e.deltaY > 0 ? "down" : "up";
			handleScroll(direction);
		},
		{ passive: false }
	);

	let touchStartY = 0;
	let isTouchActive = false;

	window.addEventListener(
		"touchstart",
		(e) => {
			touchStartY = e.touches[0].clientY;
			isTouchActive = true;
		},
		{ passive: false }
	);

	window.addEventListener(
		"touchmove",
		(e) => {
			e.preventDefault();
			if (!isTouchActive || isAnimating || !scrollAllowed) return;
			const touchCurrentY = e.touches[0].clientY;
			const difference = touchStartY - touchCurrentY;
			if (Math.abs(difference) > 10) {
				isTouchActive = false;
				const direction = difference > 0 ? "down" : "up";
				handleScroll(direction);
			}
		},
		{ passive: false }
	);

	window.addEventListener("touchend", () => {
		isTouchActive = false;
	});
});
