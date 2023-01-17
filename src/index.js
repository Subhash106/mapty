import L from "leaflet";

let map, mapEvent;
const form = document.querySelector(".form");

if (navigator.geolocation)
  navigator.geolocation.getCurrentPosition(
    function (position) {
      const { latitude, longitude } = position.coords;
      console.log(latitude, longitude);
      map = L.map("map").setView([latitude, longitude], 13);

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      map.on("click", function (e) {
        mapEvent = e;
        form.classList.remove("hidden");
      });
    },
    function (e) {
      console.log("error accured", e);
    }
  );

// window.addEventListener("keydown", function (e) {
//   if (e.key === "Enter") {
//     form.submit();
//   }
// });

form.addEventListener("submit", function (e) {
  console.log("form submitted");
  e.preventDefault();

  const { lat, lng } = mapEvent.latlng;

  L.marker([lat, lng])
    .addTo(map)
    .bindPopup(
      L.popup({
        maxWidth: 250,
        minHeight: 100,
        autoClose: false,
        closeOnClick: false
      })
    )
    .setPopupContent("Workout")
    .openPopup();
});
