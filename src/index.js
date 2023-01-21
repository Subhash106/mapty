import L from "leaflet";

const form = document.querySelector(".form");
const distanceInput = document.getElementById("distance");
const durationInput = document.getElementById("duration");
const cadenceInput = document.getElementById("cadence");
const elevationInput = document.getElementById("elevation");
const formGroupCadence = document.querySelector(".form__group--cadence");
const formGroupElevation = document.querySelector(".form__group--elevation");
const workoutContainer = document.querySelector(".workouts");

class Workout {
  date = new Date();
  id = (new Date().getTime() + "").slice(-10);
  months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  getDescription() {
    this.description = `${this.type.at(0).toUpperCase()}${this.type.slice(
      1
    )} on ${this.date.getDate()} ${this.months[this.date.getMonth()]}`;
    return this.description;
  }
}

class Running extends Workout {
  type = "running";

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this.getDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = "cycling";

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this.getDescription();
  }

  calcSpeed() {
    // km/hr
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  #map;
  #mapEvent;
  #workouts = [];
  #mapZoomLavel = 13;

  constructor() {
    this._getPosition();

    form.addEventListener("submit", this._newWorkout.bind(this));

    type.addEventListener("change", this._toggleElevation);

    workoutContainer.addEventListener("click", this._zoomIntoView.bind(this));

    this._getLocalStorage();
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function (e) {
          console.log("error accured", e);
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    console.log(latitude, longitude);
    this.#map = L.map("map").setView([latitude, longitude], this.#mapZoomLavel);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: this.#mapZoomLavel,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.#map);

    this.#map.on("click", this._showForm.bind(this));

    this.#workouts.forEach(work => {
      this._renderWorkoutOnMap(work);
    });
  }

  _showForm(e) {
    this.#mapEvent = e;
    form.classList.remove("hidden");
    distanceInput.focus();
  }

  _newWorkout(e) {
    e.preventDefault();
    let workout;
    const checkPositive = (...inputs) => inputs.every(inp => inp > 0);
    const checkNumber = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const { lat, lng } = this.#mapEvent.latlng;
    let distance = distanceInput.value;
    const duration = durationInput.value;
    const cadence = cadenceInput.value;
    const elevation = elevationInput.value;

    if (type.value === "running") {
      if (
        !checkNumber(distance, duration, cadence) &&
        !checkPositive(distance, duration, cadence)
      ) {
        return alert("All inputs should be positive number!");
      }

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    if (type.value === "cycling") {
      if (
        !checkNumber(distance, duration, elevation) &&
        !checkPositive(distance, duration)
      ) {
        return alert("All inputs should be positive number!");
      }

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    this.#workouts.push(workout);

    this._setLocalStorage();

    this._renderWorkoutOnMap(workout);
    this._renderWorkoutInList(workout);

    this._hideForm();
  }

  _hideForm() {
    form.style.display = "none";
    form.classList.add("hidden");
    distanceInput.value =
      durationInput.value =
      cadenceInput.value =
      elevationInput.value =
        "";
    setTimeout(() => {
      form.style.display = "grid";
    }, 1000);
  }

  _renderWorkoutOnMap(workout) {
    const { coords, type: workoutType, description } = workout;

    L.marker(coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minHeight: 100,
          autoClose: false,
          closeOnClick: false,
          className: `workout--${workoutType}`
        })
      )
      .setPopupContent(
        `${workoutType === "running" ? "🏃‍♀️" : "🚴‍♂️"} ${description}`
      )
      .openPopup();
  }

  _renderWorkoutInList(workout) {
    const {
      id,
      type: workoutType,
      distance: workoutDistance,
      duration: workoutDuration,
      cadence: workoutCadence,
      elevationGain: workoutElevation,
      description,
      speed,
      pace
    } = workout;
    const wrkout = `<li class="workout workout--${workoutType}" data-id="${id}">
    <p class="workout--date">${description}</p>
    <div class="workout--details">
      <div class="workout--type">${
        workoutType === "running" ? "🏃‍♀️" : "🚴‍♂️"
      }${workoutDistance}Km</div>
      <div class="workout--duration">⌚ ${workoutDuration}</div>
      <div class="workout--cadence">${
        workoutType === "running"
          ? `Cadence ${workoutCadence}`
          : `Elevation ${workoutElevation}`
      }</div>
      <div class="workout--cadence">${
        workoutType === "running"
          ? `Pace ${pace.toFixed(1)}`
          : `Speed ${speed.toFixed(1)}`
      }</div>
    </div>
  </li>`;

    workoutContainer.insertAdjacentHTML("beforeend", wrkout);
  }

  _toggleElevation(e) {
    formGroupCadence.classList.toggle("hidden-form-group");
    formGroupElevation.classList.toggle("hidden-form-group");
  }

  _zoomIntoView(e) {
    const clickedWorkout = e.target.closest(".workout");

    if (!clickedWorkout) return;

    const workout = this.#workouts.find(
      wrkout => wrkout.id === clickedWorkout.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoomLavel, {
      animation: true,
      pan: {
        duration: 1
      }
    });
  }

  _setLocalStorage() {
    console.log("_setLocalStorage called");
    console.log(this.#workouts);
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = localStorage.getItem("workouts");

    if (!data) return;

    this.#workouts = JSON.parse(data);

    this.#workouts.forEach(work => {
      this._renderWorkoutInList(work);
    });
  }
}

const app = new App();
