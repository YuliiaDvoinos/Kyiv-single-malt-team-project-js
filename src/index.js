import './sass/main.scss';
import movieCardTmp from './templates/movieCard.hbs';
import movieInfoCardTmp from './templates/movieCardInfo.hbs';
import moviePosterTmp from './templates/moviePoster.hbs';
import FilmotekaApiService from './js/api/moviesApi';
import movieAdapter from './js/utils/movieListsAdapter';
import spinner from './js/components/spinner';
import debounce from 'lodash.debounce';
import { genresIdConverter } from './js/utils/genreConverter';
import './js/components/tabs';
import './js/components/backToTop';

let oldInputRef = '';

const filmotekaApiService = new FilmotekaApiService();
const body = document.querySelector('body');
const filmListRef = document.querySelector('.films-list');
const onMovieClick = document.querySelector('.js-film-list');
const modalRef = document.querySelector('.js-open-modal');
const modalContaierRef = document.querySelector('.js-modal');
const modalPosterRef = document.querySelector('.js-poster');
const lightBoxRef = document.querySelector('.overlay');
const closeBtnRef = document.querySelector('.js-close-btn');
const inputRefValue = document.querySelector('#js-input');
const errorTextRef = document.querySelector('#js-input-error');
const textErrorNotFound = 'No results were found for your request.';
const textErrorManyMatches =
  'Too many matches found. Please enter a more specific query!';

closeBtnRef.addEventListener('click', closeModal);
lightBoxRef.addEventListener('click', closeModalOnBackdrop);
inputRefValue.addEventListener('input', debounce(moviesSearch, 500));
onMovieClick.addEventListener('click', showModal);

async function showModal(event) {
  event.preventDefault();
  body.classList.add('no-scroll');
  window.addEventListener('keydown', closeModalOnEsc);
  const target = event.target.parentNode;
  if (target.parentNode.nodeName !== 'A') return;
  modalRef.classList.remove('is-hidden'); //Сначало открывается модалка, потом идет запрос
spinner.show();
  try {
    const idMovie = target.parentNode.dataset.id;
    await getMovie(idMovie);
  } catch (error) {
    console.log('Ошибка В showModal');
  }
  spinner.hide(); //--
}
// =====КНОПКИ В МОДАЛКЕ======
// const modalBtnWatched = document.querySelector('.js-modal-btn-watched');
// const modalBtnQueue = document.querySelector('.js-modal-btn-queue');
// modalBtnQueue.addEventListener('click', () => {
//   console.log('click on modalBtnQueue');
// });
// modalBtnWatched.addEventListener('click', () => {
//   console.log('click on modalBtnWatched');
// });
// ========================

async function getMovie(id) {
  const movieInfo = await filmotekaApiService.fetchMovies(id);

  //Жанр конвертер для карточки
  movieInfo.genres = await movieInfo.genres
    .map(el => {
      return el.name;
    })
    .slice(0, 2)
    .join(', ');

  renderMovieData(movieInfo);
}
async function renderMovieData(object) {
  try {
    const movieDataPoster = await moviePosterTmp(movieAdapter(object));
    const movieDataInfo = await movieInfoCardTmp(movieAdapter(object));
    appendMovieCardInfo(modalPosterRef, movieDataPoster);
    appendMovieCardInfo(modalContaierRef, movieDataInfo);
  } catch (error) {
    console.log(error + ' Ошибка в renderMovieData');
  }
}

function closeModal() {
  modalRef.classList.add('is-hidden');
  clearContainer(modalContaierRef);
  clearContainer(modalPosterRef);
  window.removeEventListener('keydown', closeModalOnEsc);
  body.classList.remove('no-scroll');
}

function closeModalOnBackdrop(event) {
  if (event.target === event.currentTarget) {
    closeModal();
  }
}
function closeModalOnEsc(event) {
  if (event.key !== 'Escape') return;
  closeModal();
}

async function PopularMovie() {
  spinner.show();
  try {
    clearContainer(filmListRef);
    const moviesList = await filmotekaApiService.fetchResults();
    const { results } = moviesList;

    const changeIdGenre = results.map(el => genresIdConverter(el));
    renderMovieList(moviesList);
  } catch (error) {
    console.log('Ошибка! (PopularMovie)');
  }
  spinner.hide();
}

async function renderMovieList(object) {
  try {
    const { results } = object;

    const movieList = await results.map(item =>
      movieCardTmp(movieAdapter(item)),
    );
    appendMovieListMarkup(movieList);
  } catch (error) {
    console.log('Ошибка! (renderMovieList)');
  }
}

PopularMovie();

async function moviesSearch(event) {
  try {
    if (!inputRefValue.value) {
      errorTextRef.textContent = '';
      await PopularMovie();
      return;
    }
    if (
      inputRefValue.value.length > 0 &&
      inputRefValue.value.trim().length < 3 // добавил трим, чтобы не отправлялись запросы, сосотоящие из одних пробелов
    ) {
      errorTextRef.textContent = textErrorManyMatches;
      if (inputRefValue.value.length > oldInputRef.length) {
        // spinner.hide();
        return;
      }
    }

    filmotekaApiService.query = event.target.value;
    spinner.show();
    const moviesList = await filmotekaApiService.fetchSearch();
    const { results } = moviesList;
    const changeIdGenre = results.map(el => genresIdConverter(el));

    if (results.length === 0) {
      spinner.hide();
      errorTextRef.textContent = textErrorNotFound;

      return;
    } else {
      spinner.hide();
      clearContainer(filmListRef);
      errorTextRef.textContent = '';
      renderMovieList(moviesList);
    }
  } catch (error) {
    console.log(error);
  }
}

function appendMovieListMarkup(results) {
  filmListRef.insertAdjacentHTML('beforeend', results.join(''));
}
function appendMovieCardInfo(ref, results) {
  ref.insertAdjacentHTML('beforeend', results);
}
function clearContainer(ref) {
  ref.innerHTML = '';
}
