// Home.jsx
import '../Home.css';
import { NavbarHome } from '../components/NavbarHome.jsx';
import carrusel1 from '../assets/img/carrusel/carrusel-1.png';
import carrusel2 from '../assets/img/carrusel/carrusel-2.png';
import carrusel3 from '../assets/img/carrusel/carrusel-3.png';
import carrusel4 from '../assets/img/carrusel/carrusel-4.png';
import logotarjeta from '../assets/img/logos/logo-tarjetas-about-us.png';

export const Home = () => {
	return (
		<>
			<NavbarHome />
			<div className="container-fluid p-0">
				{/* Carrusel Bootstrap 5 */}
				<div id="carouselExample" className="carousel slide" data-bs-ride="carousel" data-bs-interval="4000">
					{/* Indicadores (dots) */}
					<div className="carousel-indicators">
						<button type="button" data-bs-target="#carouselExample" data-bs-slide-to="0" className="active" aria-current="true" aria-label="Slide 1"></button>
						<button type="button" data-bs-target="#carouselExample" data-bs-slide-to="1" aria-label="Slide 2"></button>
						<button type="button" data-bs-target="#carouselExample" data-bs-slide-to="2" aria-label="Slide 3"></button>
						<button type="button" data-bs-target="#carouselExample" data-bs-slide-to="3" aria-label="Slide 4"></button>
					</div>
					<div className="carousel-inner">
						<div className="carousel-item active">
							<img src={carrusel1} className="d-block w-100 carousel-img" alt="PlayerLink — encuentra tu compañero de juego" />
						</div>
						<div className="carousel-item">
							<img src={carrusel2} className="d-block w-100 carousel-img" alt="PlayerLink — conecta con jugadores de todo el mundo" loading="lazy" />
						</div>
						<div className="carousel-item">
							<img src={carrusel3} className="d-block w-100 carousel-img" alt="PlayerLink — encuentra tu squad ideal" loading="lazy" />
						</div>
						<div className="carousel-item">
							<img src={carrusel4} className="d-block w-100 carousel-img" alt="PlayerLink — juega, conecta y disfruta" loading="lazy" />
						</div>
					</div>
					<button className="carousel-control-prev" type="button" data-bs-target="#carouselExample" data-bs-slide="prev">
						<span className="carousel-control-prev-icon" aria-hidden="true"></span>
						<span className="visually-hidden">Anterior</span>
					</button>
					<button className="carousel-control-next" type="button" data-bs-target="#carouselExample" data-bs-slide="next">
						<span className="carousel-control-next-icon" aria-hidden="true"></span>
						<span className="visually-hidden">Siguiente</span>
					</button>
				</div>

				<section className="howitworks-section text-white border-bottom border-top border-white" id='howitworks'>
					<div className="container">
						<div className="row d-flex align-items-center justify-content-around">
							<div className='col-12 col-md-10'>
								{/* Título horizontal solo en móvil */}
								<h2 className="section-title-mobile d-block d-md-none">HOW IT WORKS</h2>
								<div className='row d-flex justify-content-center'>
									<div className="card col-lg-6" tabIndex="0">
										<div className="card-inner box text-center">
											<div className="card-front">
												<img src={logotarjeta} alt="logoapp" />
											</div>
											<div className="card-back p-2">Sign up on our web</div>
										</div>
									</div>
									<div className="card col-lg-6" tabIndex="0">
										<div className="card-inner box text-center">
											<div className="card-front">
												<img src={logotarjeta} alt="logoapp" />
											</div>
											<div className="card-back p-2">Fill in your user details</div>
										</div>
									</div>
								</div>
								<div className='row'>
									<div className="card col-lg-6" tabIndex="0">
										<div className="card-inner box text-center">
											<div className="card-front">
												<img src={logotarjeta} alt="logoapp" />
											</div>
											<div className="card-back p-2">Find your player match</div>
										</div>
									</div>
									<div className="card col-lg-6" tabIndex="0">
										<div className="card-inner box text-center">
											<div className="card-front">
												<img src={logotarjeta} alt="logoapp" />
											</div>
											<div className="card-back p-2">Swipe left or right</div>
										</div>
									</div>
								</div>

							</div>
							{/* Texto vertical — oculto en móvil */}
							<div className="vertical-title col-2 d-none d-md-block">
								HOW IT WORKS
							</div>
						</div>
					</div>
				</section>
				{/* Best Practices */}
				<section className="bestpractices-section text-white border-bottom border-white" id='bestpractices'>
					<div className="container">
						<div className="row d-flex align-items-center">

							{/* Texto vertical — oculto en móvil */}
							<div className="vertical-title col-2 d-none d-md-block">BEST PRACTICES</div>

							{/* Contenido principal */}
							<div className='col-12 col-md-10'>
								{/* Título horizontal solo en móvil */}
								<h2 className="section-title-mobile d-block d-md-none">BEST PRACTICES</h2>
								<div className="row mb-2 pt-md-5">
									<div className="card" tabIndex="0">
										<div className="card-inner box text-center">
											<div className="card-front">
												Be Yourself
											</div>
											<div className="card-back p-2">Share your real interests, favorite games, and play style—authenticity attracts the right squad.</div>
										</div>
									</div>
									<div className="card" tabIndex="0">
										<div className="card-inner box text-center">
											<div className="card-front">
												Respect Others
											</div>
											<div className="card-back p-2">Great communities are built on mutual respect. Avoid toxicity and support positive interactions.</div>
										</div>
									</div>
									<div className="card" tabIndex="0">
										<div className="card-inner box text-center">
											<div className="card-front">
												Stay Active
											</div>
											<div className="card-back p-2">Regularly join games and chats—consistency shows commitment and keeps your squad engaged.</div>
										</div>
									</div>
								</div>
								<div className="row mb-2">
									<div className="card" tabIndex="0">
										<div className="card-inner box text-center">
											<div className="card-front">
												Use Match Filters Wisely
											</div>
											<div className="card-back p-2">Set your preferences (game genres, skill level, time zone) to find players that truly match your vibe."</div>
										</div>
									</div>
									<div className="card" tabIndex="0">
										<div className="card-inner box text-center">
											<div className="card-front">
												Give Feedback
											</div>
											<div className="card-back p-2">Rate your matches and report bad behavior—it helps keep the community safe and fun.</div>
										</div>
									</div>
									<div className="card" tabIndex="0">
										<div className="card-inner box text-center">
											<div className="card-front">
												Try New Games Together
											</div>
											<div className="card-back p-2">Explore new titles or challenges with your squad to build stronger connections.</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>
				{/* About Us */}
				<section className="about-section text-white border-bottom" id="aboutus">
					<div className="container">
						<div className="row d-flex align-items-center justify-content-around">
							<div className='col-12 col-md-10'>
								{/* Título horizontal solo en móvil */}
								<h2 className="section-title-mobile d-block d-md-none">ABOUT US</h2>
								<div className="row d-flex gap-4 justify-content-around">
									{/* Columna del contenido (orígenes + quiénes somos) */}
									<div className="col-lg-4 col-md-6 p-4 d-flex flex-column text-center tarjeta text-white">
										<div className="card-body">
											<h3 className="neon-heading mb-3">The origins</h3>
											<p className="flex-grow-1">
												Playerlink started as an academic project and, with dedication and passion, became what it is today: a web that links players around the world.
											</p>
										</div>
									</div>
									<div className="col-lg-4 col-md-6 p-4 d-flex flex-column text-center tarjeta text-white">
										<div className="card-body">
											<h3 className="neon-heading mb-3">Who are we?</h3>
											<p className="flex-grow-1">
												We are a squad of gaming enthusiasts who know the real fun starts when we play together: <br />
												Bryan, Alba & Toni
											</p>
										</div>
									</div>
								</div>
							</div>
							{/* Título vertical: solo se muestra en pantallas grandes */}
							<div className="col-2 d-none d-lg-flex justify-content-center">
								<div className="vertical-title">ABOUT US</div>
							</div>
						</div>
					</div>
				</section>
			</div>
		</>
	);
};
