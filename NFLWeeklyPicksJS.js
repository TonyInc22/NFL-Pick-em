const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
var gameIdArr = [];
var futureGames = [];
Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}
getCurrWeek = (nflWeek) => nflWeek ?? Math.ceil(((new Date()).getTime() - (new Date('9/5/2023 0:')).getTime()) / (7 * 24 * 60 * 60 * 999));
var currWeek = getCurrWeek(undefined)

$(function () {
    $('#weekNum').text('Week ' + currWeek)
    loadWeek(currWeek);
})

function loadWeek(nflWeek = undefined) {
    if (nflWeek < 1 || nflWeek > 18) return;

    reset(nflWeek);
    getSchedule(nflWeek,function () {
        getStandings(function () {
            getScores(nflWeek, function () {
                gameIdArr.forEach((gameId) => {
                    if (gameIdArr.includes(gameId)) {
                        getOdds(gameId);
                    } else {
                        loadPick(gameId);
                    }                    
                })
            });
        });
    });
}

function reset(nflWeek) {
    currWeek = getCurrWeek(nflWeek);
    $('#weekNum').text('Week ' + currWeek)
    $('#PickEmGamesTableBody').empty();
    gameIdArr = [];
    futureGames = [];
}

function getSchedule(nflWeek = undefined, callback) {
    const settings = {
        async: true,
        crossDomain: true,
        url: 'https://cdn.espn.com/core/nfl/schedule?xhr=1&year=2023&week='+getCurrWeek(nflWeek),
        method: 'GET'
    };
    
    $.ajax(settings).done(function (response) {
        console.log('NFL SCHEDULE');
        console.log('===========================================');
        console.log(response)

        let nflSchedule = response.content.schedule;
        Object.keys(response.content.schedule).forEach((key, index) => {
            
            let currDay = new Date(key.substring(0,4) + '/' + key.substring(4,6) + '/' + key.substring(6,8));
            console.log('-------------');
            console.log(weekday[currDay.getDay()]);
            console.log('-------------');

            $('#PickEmGamesTable tbody#PickEmGamesTableBody').append('<tr><td colspan=3 style="background:white"><center>'+weekday[currDay.getDay()]+'</center></td></tr>');

            nflSchedule[key].games.forEach((gameData) => {

                let gameTime = new Date(gameData.date);
                gameTime = gameTime.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}).replace(/^0?/,'');
                console.log(gameData.shortName + ': ' + gameTime)

                if (gameData.weather) {
                    console.log('\t'+gameData.weather.temperature + ' and ' + gameData.weather.displayValue);
                }

                let delimiter = ' @ ';
                if (gameData.shortName.indexOf('@') == -1) {
                    delimiter = ' VS ';
                }
                let homeTeam = gameData.shortName.split(delimiter)[1];
                let awayTeam = gameData.shortName.split(delimiter)[0];
                
                let temp = 'N/A';
                let displayVal = '';
                if (gameData.weather) {
                    temp = gameData.weather.temperature;
                    displayVal =gameData.weather.displayValue;
                }

                gameIdArr.push(gameData.id)

                $('#PickEmGamesTable tbody#PickEmGamesTableBody').append('<tr name="'+gameData.id+'" id="'+gameData.shortName+'">'
                                                    +   '<td class="teamContainer" id="'+homeTeam+'" onclick="pickTeam(this)" style="background:AliceBlue;cursor:pointer;"><table>'
                                                    +       '<tr style="width:100%; height:80%">'
                                                    +           '<td style="height:100%;background-image: url(Resources/Images/Team%20Logos/'+homeTeam+'.webp);background-position: center;background-size: 55% 100%;background-repeat: no-repeat;"></td>'
                                                    +       '</tr>'
                                                    +       '<tr style="width:100%; height:20%">'
                                                    +           '<td id="'+homeTeam+'Record"></td>'
                                                    +       '</tr>'
                                                    +   '</table></td>'
                                                    +   '<td class="detailsTD"><table>'
                                                    +       '<tr>'
                                                    +           '<td style="color:white"><b>'+gameTime+'</b></td>'
                                                    +       '</tr>'
                                                    +       '<tr>'
                                                    +           '<td style="color:white" id="'+gameData.id+'Odds">-</td>'
                                                    +       '</tr>'
                                                    +       '<tr>'
                                                    +           '<td><span style="color:'+getTempColor(temp)+'">'+temp+'</span><font color="white">°</font> <img src="Resources/Images/Weather%20Images/'+displayVal+'.png" width="10%" height="10%" alt="'+displayVal+'"></td>'
                                                    +       '</tr>'
                                                    +   '</table></td>'
                                                    +   '<td class="teamContainer" id="'+awayTeam+'" onclick="pickTeam(this)" class="TeamOption" style="background:AliceBlue;cursor:pointer;"><table>'
                                                    +       '<tr>'
                                                    +           '<td style="height:100%;background-image: url(Resources/Images/Team%20Logos/'+awayTeam+'.webp);background-position: center;background-size: 55% 100%;background-repeat: no-repeat;"></td>'
                                                    +       '</tr>'
                                                    +       '<tr>'
                                                    +           '<td id="'+awayTeam+'Record"></td>'
                                                    +       '</tr>'
                                                    +   '</table></td>'
                                                    +'</tr>')
            
            })
        })
        console.log('===========================================');
        callback();
    });
}

function getStandings(callback) {
    const settings = {
        async: true,
        crossDomain: true,
        url: 'https://cdn.espn.com/core/nfl/standings?xhr=1',
        method: 'GET'
    };
    
    $.ajax(settings).done(function (response) {
        console.log('NFL STANDINGS');
        console.log('===========================================');
        console.log(response)

        response.content.standings.groups.forEach((conference) => {
            conference.groups.forEach((division) => {
                division.standings.entries.forEach((team) => {
                    let teamStats = '';
                    for (let i = 0; i < 3; i++) {
                        if (i !== 2 || team.stats[i].displayValue != '0') teamStats += team.stats[i].displayValue + '-'; 
                    }
                    console.log(team.team.abbreviation + ': ' + teamStats.slice(0,-1));
                    
                    $('#PickEmGamesTable tbody#PickEmGamesTableBody tr td table tr td#'+team.team.abbreviation+'Record').text(teamStats.slice(0,-1));

                })
            });
        }) 
        
        console.log('===========================================');
        callback()
    });
}

function getOdds(gameId) {
    const settings = {
        async: true,
        crossDomain: true,
        url: 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/'+gameId+'/competitions/'+gameId+'/predictor',
        method: 'GET'
    };
    
    $.ajax(settings).done(function (response) {
        console.log('NFL ODDS');
        console.log('===========================================');
        
        let currGameId = response.$ref.match(/(?<=competitions\/)(\d+)/g)[0];
        
        let delimiter = ' @ ';
        if (response.shortName.indexOf('@') == -1) {
            delimiter = ' VS ';
        }
        let homeTeam = response.shortName.split(delimiter)[1];
        let awayTeam = response.shortName.split(delimiter)[0];
        
        let homeTeamOdds = response.homeTeam.statistics[0].value;
        let awayTeamOdds = response.awayTeam.statistics[0].value;

        $('#'+currGameId+'Odds').text((homeTeamOdds >= awayTeamOdds ? Math.ceil(homeTeamOdds)+'% '+homeTeam : Math.ceil(awayTeamOdds)+'% '+awayTeam))

        console.log('===========================================');
    });
}

function getScores(nflWeek, callback) {
    const settings = {
        async: true,
        crossDomain: true,
        url: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?limit=1000&dates='+getWeekSpread(getCurrWeek(nflWeek)),
        method: 'GET'
    };
    
    $.ajax(settings).done(function (response) {
        console.log('NFL SCORES');
        console.log('===========================================');
        console.log(response)

        response.events.forEach((game) => {
            if (game.status.type.completed) {
                console.log(game.shortName + ': ' + game.competitions[0].competitors[1].score + '-' + game.competitions[0].competitors[0].score)

                let homeTeamScore = Number(game.competitions[0].competitors[0].score)
                let awayTeamScore = Number(game.competitions[0].competitors[1].score)

                console.log($('tr[id="'+game.shortName+'"] td.teamContainer'))
                $('tr[id="'+game.shortName+'"] td.teamContainer').eq(1).css('background',(homeTeamScore < awayTeamScore ? 'lightgreen' : '#ff355e'))
                $('tr[id="'+game.shortName+'"] td.teamContainer').eq(0).css('background',(homeTeamScore > awayTeamScore ? 'lightgreen' : '#ff355e'))
                $('tr[id="'+game.shortName+'"] td.teamContainer').eq(1).attr('onclick','')
                $('tr[id="'+game.shortName+'"] td.teamContainer').eq(0).attr('onclick','')
                $('tr[id="'+game.shortName+'"] td.teamContainer').eq(1).css('cursor','default')
                $('tr[id="'+game.shortName+'"] td.teamContainer').eq(0).css('cursor','default')
            } else {
                futureGames.push(game.id);
            }
        })
        
        console.log('===========================================');
        callback();
    });
}

function getTempColor(temp) {
    if (temp > 90) return ('rgb(165,0,0)')
    else if (temp > 85) return ('rgb(192,0,0)')
    else if (temp > 80) return ('rgb(225,20,0)')
    else if (temp > 75) return ('rgb(255,50,0)')
    else if (temp > 70) return ('rgb(255,96,0)')
    else if (temp > 65) return ('rgb(255,160,0)')
    else if (temp > 60) return ('rgb(255,192,60)')
    else if (temp > 55) return ('rgb(255,232,120)')
    else if (temp > 50) return ('rgb(255,250,220)')
    else if (temp > 45) return ('rgb(230,255,255)')
    else if (temp > 40) return ('rgb(200,250,255)')
    else if (temp > 35) return ('rgb(160,240,255)')
    else if (temp > 30) return ('rgb(130,210,255)')
    else if (temp > 25) return ('rgb(80,180,250)')
    else if (temp > 20) return ('rgb(60,160,240)')
    else if (temp > 15) return ('rgb(30,110,200)')
    else if (temp >= 10) return ('rgb(15,75,165)')
    else if (temp < 10) return ('rgb(10,50,120)')
    else return ('rgb(255,255,255)');
}

function pickTeam(teamTD) {
    $(teamTD).closest('tr').find('.SelectedTeam').each(function(){
        $(this).removeClass("SelectedTeam");
    });
    $(teamTD).addClass('SelectedTeam')
}

function submitPicks() {
    let returnJSON = {};
    gameIdArr.forEach((gameID) => {
        if (futureGames.includes(gameID)) {
            returnJSON[gameID] = $('#PickEmGamesTable tbody#PickEmGamesTableBody tr[name='+gameID+']').find('.SelectedTeam').attr('id') ?? '';
        } else {
            returnJSON[gameID] = 'Test';
        }
    })
    console.log(returnJSON);
}

function getWeekSpread(nflWeek) {
    let nflStart = new Date('9/5/2023');
    let startDate = nflStart.addDays((nflWeek - 1) * 7);
    let endDate = nflStart.addDays(nflWeek * 7);
    return startDate.toISOString().split('T')[0].replaceAll('-','') +'-'+endDate.toISOString().split('T')[0].replaceAll('-','');
}

function loadPick() {

}