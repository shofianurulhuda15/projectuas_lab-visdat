// Fungsi untuk menghitung jumlah nilai null dalam suatu kolom
function countNull(data, column) {
  let count = 0;
  data.forEach(row => {
    if (row[column] === null || row[column] === undefined) {
      count++;
    }
  });
  return count;
}

// Fungsi untuk mengganti nilai yang hilang dengan nilai default
function replaceMissingWithDefault(data, column, defaultValue) {
  data.forEach(row => {
    if (row[column] === null || row[column] === undefined) {
      row[column] = defaultValue;
    }
  });
}

// Fungsi untuk membersihkan data
function cleanData(data) {
  return new Promise((resolve, reject) => {
    // Update nilai yang hilang untuk Country dengan nilai default 'Other'
    replaceMissingWithDefault(data, 'Country', 'Other');

    // Update nilai yang hilang untuk Derived products dengan nilai default ' '
    replaceMissingWithDefault(data, 'Derived products', ' ');

    // Cek jumlah nilai yang hilang
    console.log("Jumlah nilai null dalam kolom 'Country':", countNull(data, 'Country'));
    console.log("Jumlah nilai null dalam kolom 'Derived products':", countNull(data, 'Derived products'));

    // Resolve dengan data yang telah dibersihkan
    resolve(data);
  });
}
// Memuat data dari file CSV menggunakan fetch API
fetch('data/acquisitions_update_2021.csv')
  .then(response => response.text())
  .then(csvData => {
    // Ubah teks CSV menjadi array objek
    const data = Papa.parse(csvData, { header: true }).data;
    return cleanData(data);
  })
  .then(cleanedData => {
    // Mulai membuat diagram batang setelah data dibersihkan
    // Konversi tipe data yang diperlukan
    cleanedData.forEach(function(d) {
      d["Acquisition Year"] = +d["Acquisition Year"];
      d["Acquisition Price(Billions)"] = +d["Acquisition Price(Billions)"];
    });

    var companies = d3.group(cleanedData, function(d) { return d["Parent Company"]; });

    var companiesArray = Array.from(companies, ([key, value]) => ({ key, value: value.length }));

    // Urutkan array berdasarkan jumlah akuisisi terbanyak ke terkecil
    companiesArray.sort((a, b) => b.value - a.value);

    var width = 900;
    var height = 400;
    var margin = { top: 50, right: 50, bottom: 50, left: 50 };

    var svg = d3.select(".chart")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // Tambahkan teks di atas diagram batang
    svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("fill", "white") // Mengatur warna teks menjadi putih
    .text("Jumlah Akusisi yang Dilakukan Perusahaan");


    var x = d3.scaleBand()
      .domain(companiesArray.map(function(d) { return d.key; }))
      .range([margin.left, width - margin.right])
      .paddingInner(0.1) // Sesuaikan jarak antar batang di sini
      .paddingOuter(0.2);

    var y = d3.scaleLinear()
      .domain([0, d3.max(companiesArray, function(d) { return d.value; })])
      .range([height - margin.bottom, margin.top]);

    var xAxis = d3.axisBottom(x)
      .ticks(10); // Sesuaikan jumlah tanda sumbu-x di sini

    var yAxis = d3.axisLeft(y);

    svg.append("g")
    .attr("class", "axis-x")
    .attr("transform", "translate(0," + (height - margin.bottom) + ")")
    .call(xAxis)
    .selectAll("path, line, text") // Memilih semua elemen path, line, dan teks di sumbu x
    .style("fill", "white"); // Mengatur warna elemen-elemen tersebut menjadi putih


    svg.append("g")
    .attr("class", "axis-y")
    .attr("transform", "translate(" + margin.left + ",0)")
    .call(yAxis)
    .selectAll("path, line, text") // Memilih semua elemen path, line, dan teks di sumbu y
    .style("fill", "white"); // Mengatur warna elemen-elemen tersebut menjadi putih


    svg.selectAll(".bar")
      .data(companiesArray)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(d.key); })
      .attr("y", function(d) { return y(d.value); })
      .attr("width", x.bandwidth())
      .attr("height", function(d) { return height - margin.bottom - y(d.value); })
      // Menambahkan tooltip untuk menampilkan nilai saat di hover
      .append("title")
      .text(function(d) { return d.value; });

    // Tampilkan nilai saat dihover
    svg.selectAll(".bar")
      .on("mouseover", function(d) {
        var xPos = parseFloat(d3.select(this).attr("x")) + x.bandwidth() / 2;
        var yPos = parseFloat(d3.select(this).attr("y")) - 10;

        svg.append("text")
          .attr("class", "hover-text")
          .attr("x", xPos)
          .attr("y", yPos)
          .attr("text-anchor", "middle")
          .attr("dy", -6) // Sesuaikan posisi teks
          .text(d.value);
      })
      .on("mouseout", function() {
        svg.select(".hover-text").remove(); // Hapus teks saat mouse keluar
      });
  })
  .catch(error => {
    console.error('Error:', error);
  });
