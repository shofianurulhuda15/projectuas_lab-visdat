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

fetch('data/acquisitions_update_2021.csv')
  .then(response => response.text())
  .then(csvData => {
    // Ubah teks CSV menjadi array objek
    const data = Papa.parse(csvData, { header: true }).data;
    return cleanData(data); // Panggil fungsi cleanData untuk membersihkan data
  })
  .then(cleanedData => {
    // Menghitung total pengeluaran untuk setiap perusahaan
    const averageSpend = {};
    const count = {};
    cleanedData.forEach(entry => {
      const parentCompany = entry['Parent Company'];
      const acquisitionPrice = parseFloat(entry['Acquisition Price']); // Ubah ke tipe float
      if (!isNaN(acquisitionPrice)) { // Pastikan nilai pengeluaran valid
        if (averageSpend[parentCompany]) {
          averageSpend[parentCompany] += acquisitionPrice;
          count[parentCompany]++;
        } else {
          averageSpend[parentCompany] = acquisitionPrice;
          count[parentCompany] = 1;
        }
      }
    });

    // Menghitung rata-rata pengeluaran untuk setiap perusahaan
    const averageSpendPerCompany = {};
    for (const company in averageSpend) {
      averageSpendPerCompany[company] = averageSpend[company] / count[company];
    }

    // Mengurutkan perusahaan berdasarkan rata-rata pengeluarannya
    const sortedCompanies = Object.keys(averageSpendPerCompany).sort((a, b) => averageSpendPerCompany[b] - averageSpendPerCompany[a]);

    // Mengambil 10 perusahaan teratas
    const top10Companies = sortedCompanies.slice(0, 10);

    // Menyiapkan data untuk diagram pie chart
    const mostDominantData = top10Companies.map(company => ({ company: company, averageSpend: averageSpendPerCompany[company] }));
    console.log("Isi dari mostDominantData:");
    console.log(mostDominantData);
    // Panggil fungsi untuk membuat diagram pie chart untuk perusahaan yang memiliki rata-rata pengeluaran tertinggi
    createPieChart("piechart", mostDominantData);
  })
  .catch(error => {
    console.error('Error:', error);
  });


// Fungsi untuk membuat diagram pie chart
function createPieChart(containerId, data) {
  var totalSpend = data.reduce((total, d) => total + d.averageSpend, 0);
  var width = 600; // Lebar SVG diperbesar menjadi 600
  var height = 650; // Tinggi SVG diperbesar menjadi 650
  var radius = Math.min(width, height) / 2 - 30;

  var svg = d3.select("#" + containerId)
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Menambahkan judul
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 30) // Menyesuaikan posisi judul
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .style("fill", "white") // Menjadikan teks warna putih
    .text("Rata-rata pengeluaran dari setiap perusahaan induk");

  var chartGroup = svg.append("g")
    .attr("transform", "translate(" + width / 2 + "," + (height / 2) + ")"); // Memindahkan pie chart ke bawah sebesar 50 piksel

  var color = d3.scaleOrdinal(d3.schemeCategory10);

  var pie = d3.pie()
    .value(function (d) {
      return d.averageSpend;
    });

  var arc = d3.arc()
    .outerRadius(radius - 10)
    .innerRadius(0);

  var labelArc = d3.arc()
    .outerRadius(function (d) {
      return d.data.company === "Disney" ? radius - 180 : radius - 20;
    })
    .innerRadius(function (d) {
      return d.data.company === "Disney" ? radius - 180 : radius - 60;
    });


  var arcs = chartGroup.selectAll("arc")
    .data(pie(data))
    .enter()
    .append("g")
    .attr("class", "arc");

  arcs.append("path")
    .attr("d", arc)
    .attr("fill", function (d) {
      return color(d.data.company);
    })
    // Event saat mouse hover untuk zoom in
    .on("mouseover", function (event, d) {
      d3.select(this)
        .style("transform", "scale(1.1)") // Zoom in
        .style("transition", "transform 0.2s ease");
    })
    // Event saat mouse keluar untuk kembali ke ukuran normal
    .on("mouseout", function (event, d) {
      d3.select(this)
        .style("transform", "scale(1)") // Kembali ke ukuran normal
        .style("transition", "transform 0.2s ease");
    });

  arcs.append("text")
    .attr("transform", function (d) {
      var pos = labelArc.centroid(d); // Mendapatkan centroid dari setiap slice
      var angle = Math.atan2(pos[1], pos[0]) * (180 / Math.PI) + 180; // Menghitung sudut rotasi berdasarkan posisi centroid
      if (d.data.company === "Disney") {
        angle -= 180; // Menambahkan 180 derajat jika nama perusahaan adalah "Disney"
      }
      return "translate(" + pos + ") rotate(" + angle + ")"; // Menggabungkan translasi dan rotasi
    })
    .attr("dy", "0.35em")
    .text(function (d) {
      return d.data.company + " - " + ((d.data.averageSpend / totalSpend) * 100).toFixed(2) + "%"; // Menampilkan nama perusahaan dan persentase
    });
}
