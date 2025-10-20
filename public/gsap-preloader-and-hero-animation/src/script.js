gsap.registerPlugin(CustomEase, SplitText);
CustomEase.create(
	"stutterEase",
	"M0,0 C0,0 0.052,0.1 0.152,0.1 0.242,0.1 0.299,0.349 0.399,0.349 0.586,0.349 0.569,0.596 0.67,0.624 0.842,0.671 0.95,0.95 1,1"
);
const textAnimations = {
	logoAnimation: (el) => {
		const split = SplitText.create(el, {
			type: "chars",
			smartWrap: true,
			mask: "chars"
		});

		split.chars.forEach((charEl) => {
			const text = charEl.innerText;
			charEl.innerHTML = "";
			const ogDiv = document.createElement("div");
			ogDiv.className = "og-char";
			ogDiv.innerText = text;
			const dupDiv = document.createElement("div");
			dupDiv.className = "duplicate-char";
			dupDiv.innerText = text;
			charEl.appendChild(ogDiv);
			charEl.appendChild(dupDiv);
		});

		gsap.from(split.chars, {
			yPercent: -100,
			ease: "power2.inOut",
			stagger: {
				each: 0.02,
				from: "random"
			},
			duration: 0.5,
			repeat: 1,
			repeatDelay: 0.75
		});
	},
	headerAnimation: (el) => {
		const split = SplitText.create(el, {
			type: "chars",
			smartWrap: true,
			mask: "chars",
			charsClass: "header-char"
		});

		gsap.from(split.chars, {
			xPercent: -100,
			ease: "power2.inOut",
			stagger: {
				each: 0.02,
				from: "random"
			},
			duration: 0.5
		});
	},
	bodyAnimation: (el) => {
		const split = SplitText.create(el, {
			type: "lines",
			mask: "lines",
			autoSplit: true,
			onSplit: (self) => {
				return gsap.from(self.lines, {
					opacity: 0,
					yPercent: -100,
					duration: 0.9,
					stagger: 0.1,
					// ease: "back.inOut(2)",
					ease: "power3.inOut",
					scrollTrigger: {
						trigger: el,
						start: "top 90%"
					}
				});
			}
		});
	}
};

function animateText(el) {
	document.fonts.ready.then(() => {
		gsap.set(el, { visibility: "visible" });
		const animType = document.querySelector(el).dataset.textAnim;
		const animFunc = textAnimations[animType];
		console.log(animFunc);
		if (animFunc) animFunc(el);
	});
}

function preloaderAnimation() {
	let tl = gsap.timeline();
	tl
		.call(animateText, [".logo-text"])
		.to(".preloader-bg", {
			scaleX: 1,
			ease: "stutterEase",
			duration: 2.8
		})
		.to(".preloader-mask", {
			scale: 3,
			duration: 0.9,
			ease: "expoScale(0.5,7,power1.in)"
		})
		.to(
			".preloader-bg, .preloader-logo, .preloader-progress-bar",
			{
				opacity: 0,
				duration: 0.85,
				ease: "power2.inOut"
			},
			"<"
		)
		.to(
			".hero-img img",
			{
				scale: 1,
				duration: 2.85,
				ease: "expoScale(0.5,7,power1.out)"
			},
			"<"
		);

	return tl;
}

function heroAnimation() {
	let tl = gsap.timeline();
	tl
		.call(animateText, [".tagline p"])
		.fromTo(
			".divider",
			{
				scaleY: 0,
				transformOrigin: "top"
			},
			{
				scaleY: 1,
				duration: 0.5,
				ease: "back.inOut"
			},
			"+=.5"
		)
		.fromTo(
			"[data-fade-in]",
			{
				filter: "blur(30px)",
				opacity: 0,

				yPercent: (index, element) => {
					return element.getAttribute("data-fade-in") === "down" ? -100 : 0;
				},

				xPercent: (index, element) => {
					return element.getAttribute("data-fade-in") === "left" ? 100 : 0;
				}
			},

			{
				yPercent: 0,
				xPercent: 0,

				filter: "blur(0px)",
				opacity: 1,
				duration: 1.25,
				ease: "power4.inOut",
				stagger: 0.08
			},
			"<-.25"
		)
		.call(animateText, ["h1"], "<.55")
		.call(animateText, [".sub-title"], "-=.75");

	return tl;
}

window.addEventListener("load", () => {
	const introTimeline = gsap.timeline();
	const preloaderTl = preloaderAnimation();
	const heroTl = heroAnimation();
	introTimeline.add(preloaderTl).add(heroTl, "-=2.4");
});
