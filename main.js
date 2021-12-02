const puppeteer = require("puppeteer");
const puppeteer_jquery = require("puppeteer-jquery");
const fs = require("fs");
const { decrypt } = require("./crypt");

const configs = JSON.parse(fs.readFileSync("password.json").toString());
configs.forEach((config) => {
    config.passwd = decrypt(config.passwd_encrypted);
})

const daka_and_baobei = async (config) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto("https://passport.ustc.edu.cn/login?service=https%3A%2F%2Fweixine.ustc.edu.cn%2F2020%2Fcaslogin");
    const pageEx = puppeteer_jquery.pageExtend(page);

    console.log("正在进行:", config.id);
    await pageEx.jQuery('#username').val(config.id);
    await pageEx.jQuery('#password').val(config.passwd);
    await pageEx.evaluate(validatecode);
    await pageEx.screenshot({ path: "login.png" });

    const login_state = await Promise.all([pageEx.click('#login'), pageEx.waitForNavigation({ waitUntil: 'networkidle0' })]).catch((e) => {
        console.log("错误：统一身份认证登录失败。");
        return "error";
    });
    if (login_state === "error") {
        await browser.close();
        return;
    }
    console.log("统一身份认证已登录");

    await pageEx.click('input[name="now_address"][value="1"]')//内地

    await pageEx.evaluate(() => {
        $('button[data-id="now_province"]+.dropdown-menu [data-original-index="12"] > a').click();//安徽省
        $('button[data-id="now_city"]+.dropdown-menu [data-original-index="1"] > a').click();//合肥市
        $('button[data-id="now_country"]+.dropdown-menu [data-original-index="3"] > a').click();//蜀山区
        $('button[data-id="body-condition"]+.dropdown-menu [data-original-index="1"] > a').click();//正常
        $('button[data-id="body-status"]+.dropdown-menu [data-original-index="1"] > a').click();//正常在校园内
    })

    await pageEx.click('input[name="is_inschool"][value="4"]');//中区
    await pageEx.click('input[name="has_fever"][value="0"]');//无症状
    await pageEx.click('input[name="last_touch_sars"][value="0"]');//无接触
    await pageEx.click('input[name="is_danger"][value="0"]');//无风险
    await pageEx.click('input[name="is_goto_danger"][value="0"]');//无旅居

    await pageEx.jQuery('[name="jinji_lxr"]').val(config.jinji[0]);
    await pageEx.jQuery('[name="jinji_guanxi"]').val(config.jinji[1]);
    await pageEx.jQuery('[name="jiji_mobile"]').val(config.jinji[2]);
    await pageEx.jQuery('[name="other_detail"]').val(config.teshu);
    pageEx.setViewport({
        width: 600, height: 1800,
    })
    await pageEx.screenshot({ path: "check.png", fullPage: true });//不能删 删了就出错

    const daka_state = await Promise.all([pageEx.click('#report-submit-btn-a24'), pageEx.waitForNavigation({ waitUntil: 'networkidle0' })]).catch(async (e) => {
        console.log("错误：打卡失败。");
        await pageEx.screenshot({ path: "daka_error.png" });
        return "error";
    })
    if (daka_state === "error") {
        await browser.close();
        return;
    }
    console.log("打卡已完成");
    await pageEx.screenshot({ path: "daka.png" });

    await pageEx.goto("https://weixine.ustc.edu.cn/2020/apply/daliy");
    await pageEx.click('.form-group.clearfix > label');
    const baobei_state = await Promise.all([pageEx.click('#report-submit-btn'), pageEx.waitForNavigation({ waitUntil: 'networkidle0' })]).catch(async (e) => {
        console.log("错误：无法完成出校报备。");
        await pageEx.screenshot({ path: "baobei_error.png" });
        return "error";
    });
    if (baobei_state === "error") {
        await browser.close();
        return;
    }
    console.log("出校报备已完成");
    await pageEx.screenshot({ path: "baobei.png" });

    await browser.close();
};

const main = async () => {
    for (const config of configs) {
        await daka_and_baobei(config);
        console.log("OK");
    }
}

main();

const validatecode = () => {
    const compare_numbers = [
        '00000001111110000000000001111111111000001000111111111111000000011111111111111000001111110000111111000011111000000111110000111110000001111100011111000000001111100111110000000011111001111100000000111110011111000000001111100111110000000011111001111100000000111110011111000000001111100111110000000011111000111110100001111100001111100000011111000011111100001111110000011111111111111000000011111111111100000000011111111110000000000011111110000000',
        '00000011111111000000000011111111110000000000111111111100000100001111111111000000000011100111110000001010000001111100000001000000011111000000000000000111110000000000000001111100000100000000011111000000000000000111110000000000000001111100000000000000011111000000000000000111110001000000000001111100000000000000011111000000000000000111110000000000000001111100000000001111111111111110000011111111111111100000111111111111111000001111111111111110',
        '00001111111110000000001111111111111000000011111111111111100000111111111111111000001111000001111111010010000000001111110000000000000001111100000000000000011111000000000000000111110000000000001011111100000000000001111110000000000000111111100000000000011111110000000000001111111000000000001111111100000000000111111110000000000011111111000000000001111111100000000000111111111111111100001111111111111111000011111111111111110000111111111111111100',
        '00000111111110000000010111111111111010000001111111111111000000011111111111111000000110000001111110000000000000001111100000000000000011111000000000000000111110000000000001011111000000000011111111110000000000111111110000000000001111111111000000000011111111111000000000000001111111000000000000000111110000000000000001111100001000000000011111000011100000011111110000111111111111111000001111111111111110000001111111111110000000000111111110000000',
        '00000000011111110000000000000111111100000000000011111111001000000001111111110000000000011101111100000000001111011111000000000111100111110000000001110001111100000000111101011111010000011110000111110100000111000001111100000011110000011111000001111000000111110000011100000001111100000111111111111111111001111111111111111110011111111111111111100111111111111111111000000000000111110000000000000001111100000000000000011111000000000000000111110000',
        '01011111111111110000000111111111111100000001111111111111000000011111111111110000000111110000000000000001111100000000000000011111000000000000000111111111110000000001111111111110000000011111111111110001000111111111111110000001110000011111110000010000000011111100000000000000011111000000000000010111110000000000000001111100001000000000111111000011100000011111100000111111111111111000001111111111111100000001111111111110000000000011111110000000',
        '00000001011111100000000000011111111110000000011111111111110000001111111111111100000011111100000111000001111100000000010000011111000000000000001111100111111000000011111111111111000000111111111111111000001111111111111111000011111100000111111000111110000000111110001111100000001111100011111000000011111000111110000000111110000111100000001111100001111100000111110000001111111111111110000001111111111110000000001111111111000000000000111111000000',
        '00111111111111111100001111111111111111000011111111111111110000111111111111111100000000001000111110000000000000001111100000000000000111111000000000000001111100000000000000111111000000000000001111100000000000000111111000000000000001111100000000000000111111000000000000001111100000000100000011111000000000000001111110000000000000011111000000000000001111110000000000000011111000000000000001111110000000000000011111000000000000001111110000000000',
        '00000001111111000001000001111111111100000000111111111111100000011111111111111100000111111000111111000001111100000111110000011111000001111100000111111000111111000000111111111111100000000111111111110000000001111111111100000101111111111111110000011111100001111100001111100000001111100011111000000011111000111110000000111110001111100000001111100011111100000111111000011111111111111100000111111111111111000000111111111111100000000001111111000000',
        '00000001111110000000000001111111111000000000111111111111000000011111111111111000000111110000011111000011111000000011110000111110000000111100001111100000001111100011111000000011111000111110000000111110001111110000011111100001111111111111111000001111111111111110000001111111111111100000001111110011111000000000000001111100000101000000011111000001110000011111100000011111111111111000000111111111111100000000111111111100000000000011111100000000'
    ];
    var img_LT = new Image(128, 32);
    img_LT.src = 'https://passport.ustc.edu.cn/validatecode.jsp?type=login';
    var canvas = document.createElement("canvas");
    canvas.style.backgroundColor = "white";
    var ctx = canvas.getContext("2d");
    img_LT.onload = () => {
        ctx.drawImage(img_LT, 0, 0);
        var imgdata = ctx.getImageData(0, 0, 128, 32).data;
        var green_average = 0;
        for (var j = 0; j < 128 * 32; j++) {
            green_average += imgdata[4 * j + 1];
        }
        green_average /= (128 * 32);
        var numbers = ["", "", "", ""];
        for (var i = 4; i < 26; i++) {
            for (var j = 26; j < 46; j++) {
                var pixel = imgdata[4 * (128 * i + j) + 1] > green_average ? '0' : '1';
                numbers[0] += pixel;
            }
            for (var j = 47; j < 67; j++) {
                var pixel = imgdata[4 * (128 * i + j) + 1] > green_average ? '0' : '1';
                numbers[1] += pixel;
            }
            for (var j = 68; j < 88; j++) {
                var pixel = imgdata[4 * (128 * i + j) + 1] > green_average ? '0' : '1';
                numbers[2] += pixel;
            }
            for (var j = 89; j < 109; j++) {
                var pixel = imgdata[4 * (128 * i + j) + 1] > green_average ? '0' : '1';
                numbers[3] += pixel;
            }
        }
        var LT = "";
        for (var i = 0; i < 4; i++) {
            var index = '0';
            var min_different = 440;
            for (var j = 0; j < 10; j++) {
                var different = 0;
                for (var k = 0; k < 440; k++) {
                    if (numbers[i].charAt(k) != compare_numbers[j].charAt(k)) {
                        different += 1;
                    }
                }
                if (different < min_different) {
                    min_different = different;
                    index = j + '';
                }
            }
            LT += index;
        }
        $('.group #validate').val(LT);
    }
}