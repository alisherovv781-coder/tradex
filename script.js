/* =====================================================
   TradeX Pro
   Demo Trading Simulator
   ===================================================== */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);


/* ================= STATE ================= */

let state = {
    balance: 100000,
    symbol: "BTC/USD",
    price: 83750,
    side: "BUY",
    candles: [],
    positions: [],
    history: [],
    grid: true,
    crosshair: false
};

let account = JSON.parse(localStorage.getItem("tradexAccount")) || null;


/* ================= AUTH ================= */

const authScreen = $("#authScreen");
const app = $("#app");

const loginTab = $("#loginTab");
const registerTab = $("#registerTab");

const loginForm = $("#loginForm");
const registerForm = $("#registerForm");


loginTab.addEventListener("click", () => {

    loginTab.classList.add("active");
    registerTab.classList.remove("active");

    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");

});


registerTab.addEventListener("click", () => {

    registerTab.classList.add("active");
    loginTab.classList.remove("active");

    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");

});


registerForm.addEventListener("submit", (e) => {

    e.preventDefault();

    const name = $("#registerName").value.trim();
    const email = $("#registerEmail").value.trim();
    const password = $("#registerPassword").value;

    if (!name || !email || !password) {
        showToast("Barcha maydonlarni to‘ldiring");
        return;
    }

    account = {
        name,
        email,
        password
    };

    localStorage.setItem(
        "tradexAccount",
        JSON.stringify(account)
    );

    showToast("Account yaratildi!");

    setTimeout(() => {
        loginTab.click();
        $("#loginEmail").value = email;
    }, 600);

});


loginForm.addEventListener("submit", (e) => {

    e.preventDefault();

    const email = $("#loginEmail").value.trim();
    const password = $("#loginPassword").value;

    if (!account) {
        showToast("Avval Register qiling");
        return;
    }

    if (
        email !== account.email ||
        password !== account.password
    ) {
        showToast("Email yoki parol noto‘g‘ri");
        return;
    }

    openTrading();

});


function openTrading() {

    authScreen.classList.add("hidden");
    app.classList.remove("hidden");

    updateProfile();

    createCandles();
    resizeCanvas();
    drawCandles();

    updateTradeUI();

}


/* ================= PROFILE ================= */

function updateProfile() {

    if (!account) return;

    const firstLetter =
        account.name.charAt(0).toUpperCase();

    $("#userName").textContent = account.name;
    $("#avatar").textContent = firstLetter;

    $("#profileName").textContent = account.name;
    $("#profileEmail").textContent = account.email;

    $("#profileAvatar").textContent = firstLetter;

    $("#cardHolder").textContent =
        account.name.toUpperCase();

}


$("#profileBtn").addEventListener("click", () => {

    updateProfile();

    $("#profileBalance").textContent =
        money(state.balance);

    $("#profileModal").classList.add("show");

});


$("#closeProfile").addEventListener("click", () => {

    $("#profileModal").classList.remove("show");

});


$("#profileModal").addEventListener("click", (e) => {

    if (e.target.id === "profileModal") {
        $("#profileModal").classList.remove("show");
    }

});


$("#logoutBtn").addEventListener("click", () => {

    $("#profileModal").classList.remove("show");

    app.classList.add("hidden");
    authScreen.classList.remove("hidden");

    $("#loginPassword").value = "";

    showToast("Logout qilindi");

});


/* ================= CANVAS ================= */

const canvas = $("#tradingChart");
const ctx = canvas.getContext("2d");


function resizeCanvas() {

    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;

    ctx.setTransform(
        devicePixelRatio,
        0,
        0,
        devicePixelRatio,
        0,
        0
    );

    drawCandles();

}


window.addEventListener("resize", resizeCanvas);


/* ================= CANDLES ================= */

function createCandles() {

    state.candles = [];

    let price = state.price * 0.94;

    for (let i = 0; i < 70; i++) {

        const open = price;

        const move =
            (Math.random() - 0.47) *
            state.price *
            0.012;

        const close = open + move;

        const high =
            Math.max(open, close) +
            Math.random() * state.price * 0.006;

        const low =
            Math.min(open, close) -
            Math.random() * state.price * 0.006;

        state.candles.push({
            open,
            high,
            low,
            close
        });

        price = close;
    }

}


function drawCandles() {

    if (!canvas.width) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    ctx.clearRect(0, 0, width, height);

    /* BACKGROUND */

    ctx.fillStyle = "#07130f";
    ctx.fillRect(0, 0, width, height);


    /* GRID */

    if (state.grid) {

        ctx.strokeStyle = "#10251e";
        ctx.lineWidth = 1;

        for (let x = 0; x < width; x += 65) {

            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();

        }

        for (let y = 0; y < height; y += 55) {

            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();

        }

    }


    const candles = state.candles;

    if (!candles.length) return;


    let max = Math.max(...candles.map(c => c.high));
    let min = Math.min(...candles.map(c => c.low));

    const padding = 35;

    const chartHeight = height - padding * 2;

    const priceToY = (price) => {

        return padding +
            ((max - price) / (max - min)) *
            chartHeight;

    };


    const candleWidth =
        Math.max(5, (width - 20) / candles.length * 0.65);

    const gap =
        (width - 20) / candles.length;


    candles.forEach((candle, i) => {

        const x =
            10 + i * gap + gap / 2;

        const openY = priceToY(candle.open);
        const closeY = priceToY(candle.close);
        const highY = priceToY(candle.high);
        const lowY = priceToY(candle.low);

        const bullish =
            candle.close >= candle.open;


        /* WICK */

        ctx.strokeStyle =
            bullish ? "#00d98b" : "#ff5364";

        ctx.lineWidth = 1;

        ctx.beginPath();

        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);

        ctx.stroke();


        /* BODY */

        ctx.fillStyle =
            bullish ? "#00c984" : "#ff5364";

        const bodyTop =
            Math.min(openY, closeY);

        const bodyHeight =
            Math.max(2, Math.abs(openY - closeY));

        ctx.fillRect(
            x - candleWidth / 2,
            bodyTop,
            candleWidth,
            bodyHeight
        );

    });


    /* CURRENT PRICE */

    const priceY = priceToY(state.price);

    ctx.setLineDash([5, 5]);

    ctx.strokeStyle = "#00d98b";

    ctx.beginPath();
    ctx.moveTo(0, priceY);
    ctx.lineTo(width, priceY);
    ctx.stroke();

    ctx.setLineDash([]);


    /* PRICE LABEL */

    ctx.fillStyle = "#00d98b";

    ctx.fillRect(
        width - 85,
        priceY - 11,
        85,
        22
    );

    ctx.fillStyle = "#001b12";

    ctx.font = "bold 11px Arial";

    ctx.fillText(
        formatPrice(state.price),
        width - 78,
        priceY + 4
    );

}


/* ================= MARKET ================= */

$$(".market").forEach(market => {

    market.addEventListener("click", () => {

        $$(".market").forEach(m =>
            m.classList.remove("active")
        );

        market.classList.add("active");

        state.symbol =
            market.dataset.symbol;

        state.price =
            Number(market.dataset.price);

        $("#topSymbol").textContent =
            state.symbol;

        $("#chartSymbol").textContent =
            state.symbol;

        createCandles();

        updateTradeUI();

        drawCandles();

    });

});


/* ================= BUY / SELL ================= */

$("#buyBtn").addEventListener("click", () => {

    state.side = "BUY";

    $("#buyBtn").classList.add("active");
    $("#sellBtn").classList.remove("active");

    updateTradeUI();

});


$("#sellBtn").addEventListener("click", () => {

    state.side = "SELL";

    $("#sellBtn").classList.add("active");
    $("#buyBtn").classList.remove("active");

    updateTradeUI();

});


/* ================= AMOUNT ================= */

$("#amountInput").addEventListener(
    "input",
    updateTradeUI
);


$$(".quick-values button").forEach(button => {

    button.addEventListener("click", () => {

        $("#amountInput").value =
            button.dataset.value;

        updateTradeUI();

    });

});


function updateTradeUI() {

    const amount =
        Number($("#amountInput").value) || 0;

    const fee =
        amount * 0.001;

    const total =
        amount + fee;


    $("#tradePrice").textContent =
        money(state.price);

    $("#topPrice").textContent =
        money(state.price);

    $("#fee").textContent =
        money(fee);

    $("#total").textContent =
        money(total);

    $("#availableBalance").textContent =
        money(state.balance);


    $("#tradeBtn").textContent =
        `${state.side} ${state.symbol.split("/")[0]}`;


    if (state.side === "SELL") {

        $("#tradeBtn").classList.add("sell-mode");

    } else {

        $("#tradeBtn").classList.remove("sell-mode");

    }


    updateOHLC();

}


function updateOHLC() {

    const last =
        state.candles[state.candles.length - 1];

    if (!last) return;

    $("#openPrice").textContent =
        formatPrice(last.open);

    $("#highPrice").textContent =
        formatPrice(last.high);

    $("#lowPrice").textContent =
        formatPrice(last.low);

    $("#closePrice").textContent =
        formatPrice(last.close);

}


/* ================= TRADE ================= */

$("#tradeBtn").addEventListener("click", () => {

    const amount =
        Number($("#amountInput").value);

    if (!amount || amount <= 0) {

        showToast("Amount kiriting");

        return;
    }


    const fee =
        amount * 0.001;


    if (state.side === "BUY") {

        if (amount + fee > state.balance) {

            showToast("Balance yetarli emas");

            return;
        }

        state.balance -=
            amount + fee;


        const position = {

            id: Date.now(),

            symbol: state.symbol,

            side: "BUY",

            amount,

            price: state.price,

            time: new Date().toLocaleTimeString()

        };


        state.positions.push(position);

        state.history.push(position);


        showToast(
            `BUY ${state.symbol} muvaffaqiyatli`
        );

    }


    else {

        state.balance +=
            amount - fee;


        const position = {

            id: Date.now(),

            symbol: state.symbol,

            side: "SELL",

            amount,

            price: state.price,

            time: new Date().toLocaleTimeString()

        };


        state.history.push(position);


        showToast(
            `SELL ${state.symbol} muvaffaqiyatli`
        );

    }


    updateAccountUI();

});


function updateAccountUI() {

    $("#balance").textContent =
        money(state.balance);

    $("#availableBalance").textContent =
        money(state.balance);

    $("#profileBalance").textContent =
        money(state.balance);

    $("#positionCount").textContent =
        state.positions.length;

    $("#positionBadge").textContent =
        state.positions.length;


    renderPositions();

}


function renderPositions() {

    const container =
        $("#positionsContainer");


    if (!state.positions.length) {

        container.textContent =
            "No open positions";

        return;

    }


    container.innerHTML = state.positions
        .map(position => {

            return `
                <div style="
                    display:flex;
                    justify-content:space-between;
                    padding:15px 20px;
                    border-bottom:1px solid #18352b;
                ">

                    <strong>
                        ${position.symbol}
                    </strong>

                    <span class="${position.side === "BUY" ? "up" : "down"}">
                        ${position.side}
                    </span>

                    <span>
                        ${money(position.amount)}
                    </span>

                    <span>
                        ${money(position.price)}
                    </span>

                </div>
            `;

        })
        .join("");

}


/* ================= TOOLS ================= */

$("#gridBtn").addEventListener("click", () => {

    state.grid = !state.grid;

    drawCandles();

});


$("#crosshairBtn").addEventListener("click", () => {

    state.crosshair = !state.crosshair;

    canvas.style.cursor =
        state.crosshair ? "crosshair" : "default";

});


$("#fullscreenBtn").addEventListener("click", () => {

    const chart =
        $(".chart-panel");

    if (!document.fullscreenElement) {

        chart.requestFullscreen();

    } else {

        document.exitFullscreen();

    }

});


/* ================= LIVE MARKET ================= */

setInterval(() => {

    if (app.classList.contains("hidden")) return;


    const volatility =
        state.price * 0.0008;

    state.price +=
        (Math.random() - 0.5) * volatility;


    let last =
        state.candles[state.candles.length - 1];


    if (!last) return;


    last.close =
        state.price;

    last.high =
        Math.max(last.high, state.price);

    last.low =
        Math.min(last.low, state.price);


    if (Math.random() > 0.75) {

        const open =
            state.price;

        const close =
            state.price +
            (Math.random() - 0.5) *
            state.price *
            0.003;

        state.candles.push({

            open,

            close,

            high: Math.max(open, close),

            low: Math.min(open, close)

        });


        if (state.candles.length > 70) {

            state.candles.shift();

        }

    }


    updateTradeUI();

    drawCandles();

}, 1000);


/* ================= HELPERS ================= */

function money(value) {

    return "$" +
        Number(value).toLocaleString(
            "en-US",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

}


function formatPrice(value) {

    if (value < 1) {

        return Number(value)
            .toFixed(4);

    }

    return Number(value)
        .toLocaleString(
            "en-US",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

}


function showToast(message) {

    const toast = $("#toast");

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);

}


/* ================= AUTO LOGIN ================= */

if (account) {

    loginTab.click();

}
