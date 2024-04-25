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

// Fungsi untuk membuat diagram batang horizontal
function createBarChart(containerId, data, isMostDominant) {
    var width = 700; // Lebar SVG diperbesar menjadi 600
    var height = 500; // Tinggi SVG diperbesar menjadi 600
    var margin = { top: 80, right: 100, bottom: 40, left: 180 };
    var barHeight = 30;

    var svg = d3.select("#" + containerId)
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Tambahkan elemen tooltip
    var tooltip = d3.select("#" + containerId)
        .append("div")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "white")
        .style("padding", "5px")
        .style("border", "1px solid #ccc")
        .style("border-radius", "5px");

    var x = d3.scaleLinear()
        .domain([0, d3.max(data, function(d) { return d.count; })])
        .range([margin.left, width - margin.right]);

    var y = d3.scaleBand()
        .domain(data.map(function(d) { return d.sector; }))
        .range([margin.top, height - margin.bottom])
        .padding(0.1);

    svg.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", x(0))
        .attr("y", function(d) { return y(d.sector); })
        .attr("width", function(d) { return x(d.count) - margin.left; })
        .attr("height", y.bandwidth())
        .attr("fill", isMostDominant ? "steelblue" : "orange") // Warna bar awal
        // Event saat mouse hover
        .on("mouseover", function(event, d) {
            d3.select(this).attr("fill", "orange"); // Ubah warna bar menjadi orange
            tooltip.style("visibility", "visible")
                .html(d.count) // Tampilkan jumlah di dalam tooltip
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 30) + "px");
        })
        // Event saat mouse keluar dari bar
        .on("mouseout", function() {
            d3.select(this).attr("fill", isMostDominant ? "steelblue" : "orange"); // Kembalikan warna bar
            tooltip.style("visibility", "hidden");
        });

    svg.append("g")
        .attr("transform", "translate(0," + (height - margin.bottom) + ")")
        .call(d3.axisBottom(x))
        .selectAll("path, line, text") // Memilih semua elemen path, line, dan teks di sumbu x
        .style("fill", "white"); // Mengatur warna elemen-elemen tersebut menjadi putih
    
    svg.append("g")
        .attr("transform", "translate(" + margin.left + ",0)")
        .call(d3.axisLeft(y))
        .selectAll("path, line, text") // Memilih semua elemen path, line, dan teks di sumbu y
        .style("fill", "white"); // Mengatur warna elemen-elemen tersebut menjadi putih
    
    

    // Judul diagram
    svg.append("text")
        .attr("x", (width / 2))
        .attr("y", (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("fill", "white") // Mengatur warna teks menjadi putih
        .text("Sektor Bisnis yang Paling Banyak Diakuisisi");
}



// Fetch data dari CSV
fetch('data/acquisitions_update_2021.csv')
    .then(response => response.text())
    .then(csvData => {
        // Ubah teks CSV menjadi array objek
        const data = Papa.parse(csvData, { header: true }).data;
        return cleanData(data); // Panggil fungsi cleanData untuk membersihkan data
    })
    .then(cleanedData => {
        // Menghitung jumlah bisnis untuk setiap sektor
        const businessCounts = {};
        cleanedData
            .filter(entry => entry['Business'] !== "-") // Filter entri dengan label "-"
            .forEach(entry => {
                const business = entry['Business'];
                if (businessCounts[business]) {
                    businessCounts[business]++;
                } else {
                    businessCounts[business] = 1;
                }
            });

        // Mengurutkan sektor bisnis berdasarkan jumlahnya
        const sortedBusinesses = Object.keys(businessCounts).sort((a, b) => businessCounts[b] - businessCounts[a]);

        // Mengambil 10 sektor bisnis teratas
        const mostDominantBusinesses = sortedBusinesses.slice(0, 10);

        // Menyiapkan data untuk diagram batang horizontal
        const mostDominantData = mostDominantBusinesses.map(business => ({ sector: business, count: businessCounts[business] }));

        // Panggil fungsi untuk membuat diagram batang horizontal untuk sektor bisnis yang paling dominan
        createBarChart("most-dominant", mostDominantData, true);
    })
    .catch(error => {
        console.error('Error:', error);
    });
