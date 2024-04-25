// Muat data dari file CSV
d3.csv("data/acquisitions_update_2021.csv").then(function(data) {
  // Ubah Acquisition Price dari string ke angka
  data.forEach(function(d) {
    d['Acquisition Price'] = +d['Acquisition Price'];
  });

  // Filter data untuk hanya tahun 1990 ke atas
  data = data.filter(d => d['Acquisition Year'] >= 1990);

  // Mengurutkan data berdasarkan Acquisition Year secara menaik
  data.sort((a, b) => d3.ascending(a['Acquisition Year'], b['Acquisition Year']));

  // Mengelompokkan data berdasarkan Acquisition Year
  const yearGroups = d3.group(data, d => d['Acquisition Year']);

  // Menghitung total harga akuisisi untuk setiap tahun
  const yearPriceData = Array.from(yearGroups, ([key, value]) => ({
    year: key,
    totalPrice: d3.sum(value, d => d['Acquisition Price'])
  }));

  // Dimensi chart
  const margin = { top: 80, right: 30, bottom: 40, left: 50 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // Skala sumbu x
  const x = d3.scaleLinear()
    .domain(d3.extent(yearPriceData, d => d.year))
    .range([0, width]);

  // Skala sumbu y
  const y = d3.scaleLinear()
    .domain([0, d3.max(yearPriceData, d => d.totalPrice)])
    .range([height, 0]);

  // SVG container
  const svg = d3.select("#linechart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Menambahkan garis
  svg.append("path")
    .datum(yearPriceData)
    .attr("fill", "none")
    .attr("stroke", "yellow")
    .attr("stroke-width", 2)
    .attr("d", d3.line()
      .x(d => x(d.year))
      .y(d => y(d.totalPrice))
    );

  // Menambahkan label sumbu x
svg.append("g")
  .attr("transform", "translate(0," + height + ")")
  .call(d3.axisBottom(x).tickFormat(d3.format("d")))
  .selectAll("text, line, path") // Memilih semua elemen teks
  .style("fill", "white"); // Mengatur warna teks menjadi putih
  


  // Menambahkan label sumbu y (tanpa angka, hanya teks "Price")
svg.append("text")
.attr("transform", "rotate(-90)")
.attr("y", 0 - margin.left)
.attr("x", 0 - (height / 2))
.attr("dy", "1em")
.style("text-anchor", "middle")
.style("fill", "white") // Mengatur warna teks menjadi putih
.text("Price");

// Menambahkan judul sumbu x
svg.append("text")
.attr("class", "x label")
.attr("text-anchor", "middle")
.attr("x", width / 2)
.attr("y", height + margin.bottom)
.style("fill", "white") // Mengatur warna teks menjadi putih
.text("Acquisition Year");

// Menambahkan judul chart
svg.append("text")
.attr("class", "title")
.attr("text-anchor", "middle")
.attr("x", width / 2)
.attr("y", -margin.top / 2)
.style("fill", "white") // Mengatur warna teks menjadi putih
.text("Trend Total Biaya Akuisisi dalam Beberapa Tahun");

});
