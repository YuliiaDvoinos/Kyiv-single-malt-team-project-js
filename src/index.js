import './sass/main.scss';
import movieCardTmp from './templates/movieCard.hbs';
import movieInfoCardTmp from './templates/movieCardInfo.hbs';
import FilmotekaApiService from './js/api/moviesApi';
import movieAdapter from './js/utils/movieListsAdapter';
import spinner from './js/components/spinner';
import debounce from 'lodash.debounce';
import { genresIdConverter } from './js/utils/genreConverter';
import './js/components/tabs';

let oldInputRef = '';

const filmotekaApiService = new FilmotekaApiService();
const filmListRef = document.querySelector('.films-list');
const onMovieClick = document.querySelector('.js-film-list');
const modalRef = document.querySelector('.js-open-modal');
const modalContaierRef = document.querySelector('.js-modal');
const closeBtnRef = document.querySelector('.js-close-btn');
const inputRefValue = document.querySelector('#js-input');
const errorTextRef = document.querySelector('#js-input-error');
const textErrorNotFound = 'No results were found for your request.';
const textErrorManyMatches =
  'Too many matches found. Please enter a more specific query!';

closeBtnRef.addEventListener('click', closeModal);
inputRefValue.addEventListener('input', debounce(moviesSearch, 500));
onMovieClick.addEventListener('click', showModal);

async function showModal(event) {
  event.preventDefault();
  spinner.show(); //--
  try {
    window.addEventListener('keydown', closeModal);

    const target = event.target.parentNode;
    console.log(target); //--
    if (target.parentNode.nodeName !== 'A') return;
    const idMovie = target.parentNode.dataset.id;
    await getMovie(idMovie);
    modalRef.classList.remove('is-hidden');
  } catch (error) {
    console.log('Ошибка В showModal');
  }
  spinner.hide(); //--
}
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
    const movieDataInfo = await movieInfoCardTmp(movieAdapter(object));
    appendMovieCardInfo(movieDataInfo);
  } catch (error) {
    console.log(error + ' Ошибка в renderMovieData');
  }
}

function closeModal(event) {
  clearContainer(modalContaierRef);
  modalRef.classList.add('is-hidden');
  // console.log(event);
  if (event.code === 'ESCAPE') {
    window.removeEventListener('keydown', closeModal);
  }
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
function appendMovieCardInfo(results) {
  modalContaierRef.insertAdjacentHTML('beforeend', results);
}
function clearContainer(ref) {
  ref.innerHTML = '';
}
