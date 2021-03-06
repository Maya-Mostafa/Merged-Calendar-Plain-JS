PDSB.MergedCalendar = (function(){

    var mergedCal = '[data-mergedCal]',
        template = {
            calDpd1 : '<div class="accordion-management access-write-ribbon cal-dpd"><div class="form-inline"><div class="form-group mb-2"><span class="select-err-msg">Please choose a department</span><select onchange="PDSB.MergedCalendar.DpdChange(this)" class="form-control" name="" id="eventDeptDpd"><option value="">Select Department...</option>',
            calDpd2 : '</select></div><button type="button" class="btn btn-primary mb-2 cal-add-btn" onclick="PDSB.MergedCalendar.NewEvent()"><i class="fa fa-calendar-plus-o" aria-hidden="true"></i> Add New Event</button>'
        },

        calOptions = {
            showWeekend : false,
            viewOnly    : false,
            calList     :  ["Calendar"]
        },
        
        //functions
        calNames = function(){
            if($(mergedCal).attr('data-calList'))   
                return $(mergedCal).attr('data-calList').replace(/\s*,\s*/g, ",").split(",");
            else 
                return calOptions.calList;
        },
        deptNames = function(){
            return $(mergedCal).attr('data-cal-names').replace(/\s*,\s*/g, ",").split(",");
        },
        deptURLs = function(){
            return $(mergedCal).attr('data-cal-urls').replace(/\s*,\s*/g, ",").split(",");
        },
        deptBg = function(){
            return $(mergedCal).attr('data-cal-bg').replace(/\s*,\s*/g, ",").split(",");
        },
        deptFg = function(){
            return $(mergedCal).attr('data-cal-fg').replace(/\s*,\s*/g, ",").split(",");
        },
        displayDpd = function(calArr, deptArr, dpdArr){
            var calDpd = "", $calViewOnly = $(mergedCal).attr('viewOnly'), calViewOnly = $calViewOnly !== undefined ? true : calOptions.viewOnly;
            if (!calViewOnly){                
                for (var i=0; i<dpdArr.length; i++){
                    calDpd += "<option data-cal='"+calArr[i]+"' value='"+deptArr[i]+"'>"+dpdArr[i]+"</option>";
                }
                $(mergedCal).before(template.calDpd1 + calDpd + template.calDpd2);
            }
        },
        displayLegend = function(dpdArr, deptBg){
            var calLegend = "";
            for (var i=0; i<dpdArr.length; i++){
                calLegend += "<div><span class='legend-sq' style='background:"+deptBg[i]+"'></span><span class='legend-txt'>"+dpdArr[i]+"</span></div>";
            }
            $(mergedCal).after("<div id='calLegend'>"+calLegend+"</div>")
        },
        formateDate = function(ipDate){
            return moment.utc(ipDate).format('YYYY-MM-DD') + "T" + moment.utc(ipDate).format("hh:mm") + ":00Z";
        },
        formateEndDate = function(ipDate){
            var nextDay = moment(ipDate).add(1, 'days');
            return moment.utc(nextDay).format('YYYY-MM-DD') + "T" + moment.utc(nextDay).format("hh:mm") + ":00Z";
        },
        newEvent = function(){
            var dept = $('#eventDeptDpd').val();
            var cal = $('#eventDeptDpd').find(':selected').attr('data-cal');
            if (dept == ""){
                $('.select-err-msg').show();
                $('.select-err-msg').next('select').addClass('select-err');
            }
            else{
                $('.select-err-msg').hide();
                $('.select-err-msg').next('select').removeClass('select-err');
                PDSB.UI.OpenResult('New Calendar Event', "/" + dept + "/Lists/"+ cal +"/NewForm.aspx", true);
            }
        },
        dpdChange = function(dpd){
           if ($(dpd).val() != ""){
                $('.select-err-msg').hide();
                $('.select-err-msg').next('select').removeClass('select-err');
           } 
        },
        parseRecurrentEvent = function(recurrXML, startDate, endDate){
            //console.log(recurrXML)
            if (recurrXML.indexOf("<recurrence>") != -1){
                var rruleObj = {}, weekDay = {},
                    $recurrXML = $(recurrXML),
                    $recurrFreq = $recurrXML.find('repeat').html(),
                    isRepeatForever = $recurrXML.find('repeatForever').html(),
                    firstDayOfWeek = $recurrXML.find('firstDayOfWeek').html(),
                    repeatInstances = $recurrXML.find('repeatInstances').html();

                rruleObj.dtstart = startDate;   //dtstart
                rruleObj.until = endDate;   //until
                
                switch(true){
                    case ($recurrFreq.indexOf('yearly') != -1):
                        rruleObj.freq = "yearly";   //freq                    
                        break;
                    case ($recurrFreq.indexOf('monthly') != -1):
                        rruleObj.freq = "monthly";
                        break;
                    case ($recurrFreq.indexOf('weekly') != -1):
                        rruleObj.freq = "weekly";
                        break;
                    case ($recurrFreq.indexOf('daily') != -1):
                        rruleObj.freq = "daily";
                        break;
                }

                if(repeatInstances)                         rruleObj.count = repeatInstances;   //count
                if($($recurrFreq).attr('dayFrequency'))     rruleObj.interval = parseInt($($recurrFreq).attr('dayFrequency')); //interval - daily
                if($($recurrFreq).attr('weekFrequency'))    rruleObj.interval = parseInt($($recurrFreq).attr('weekFrequency')); //interval - weekly
                if($($recurrFreq).attr('monthFrequency'))   rruleObj.interval = parseInt($($recurrFreq).attr('monthFrequency')); //interval - monthly
                if($($recurrFreq).attr('yearFrequency'))    rruleObj.interval = parseInt($($recurrFreq).attr('yearFrequency')); //interval - yearly
                if($($recurrFreq).attr('month'))            rruleObj.bymonth = parseInt($($recurrFreq).attr('month'));    //bymonth
                if($($recurrFreq).attr('day'))              rruleObj.bymonthday = parseInt($($recurrFreq).attr('day'));    //bymonthday
                if($($recurrFreq).attr('weekday'))          rruleObj.byweekday = [0,1,2,3,4];   //byweekday - passing weekDays

                if($recurrFreq.indexOf('byday') != -1){
                    weekDay.weekday = getWeekDay($recurrFreq);
                    if ($($recurrFreq).attr('weekdayOfMonth')){
                        weekDay.n = getDayOrder($recurrFreq);
                    }
                    rruleObj.byweekday = [weekDay]; //byweekday - passing n, weekDay
                }

                //console.log(rruleObj);
                return rruleObj;

            }else return {dtstart: startDate, until: endDate, freq: "daily", interval: 1}
        },
        getWeekDay = function(byDayTag){
            var weekDay;
            switch("TRUE"){
                case ($(byDayTag).attr('mo')):
                    weekDay = 0;
                    break;
                case ($(byDayTag).attr('tu')):
                    weekDay = 1;
                    break;
                case ($(byDayTag).attr('we')):
                    weekDay = 2;
                    break;
                case ($(byDayTag).attr('th')):
                    weekDay = 3;
                    break;
                case ($(byDayTag).attr('fr')):
                    weekDay = 4;
                    break;
                case ($(byDayTag).attr('sa')):
                    weekDay = 5;
                    break;
                case ($(byDayTag).attr('su')):
                    weekDay = 6;
                    break;
            }
            return weekDay;
        },
        getDayOrder = function(byDayTag){
            var weekdayOfMonth = $(byDayTag).attr('weekdayOfMonth'), dayOrder;
            switch (weekdayOfMonth){
                case ("first"):
                    dayOrder = 1;
                    break;
                case ("second"):
                    dayOrder = 2;
                    break;
                case ("third"):
                    dayOrder = 3;
                    break;
                case ("fourth"):
                    dayOrder = 4;
                    break;
                case ("last"):
                    dayOrder = -1;
                    break;
            }
            return dayOrder;
        },
        getCalsData = function(info, calURL, calListName, successCallback, failureCallback){
            var opencall = $.ajax({
                url:  calURL,
                type: "GET",
                dataType: "json",
                headers: {
                    Accept: "application/json;odata=verbose"
                },
                error :function (xhr, ajaxOptions, thrownError){
                    if(xhr.status == 404) {
                        alert("404: " + calURL.substring(0, calURL.indexOf('?')));
                    }
                }
            });
            opencall.done(function (data, textStatus, jqXHR) {
                var events = [], startDateMod, endDateMod;
                for (index in data.d.results){

                    //workaround for FullCalendar threshold bug for the all day events time 00:00:00Z
                    if (data.d.results[index].fAllDayEvent){
                        startDateMod = new Date(data.d.results[index].EventDate);
                        startDateMod.setTime(startDateMod.getTime());
                        startDateMod = formateDate(startDateMod);

                        endDateMod = new Date(data.d.results[index].EndDate);
                        endDateMod.setTime(endDateMod.getTime());
                        endDateMod = formateEndDate(endDateMod);
                    }
                    else{
                        startDateMod = data.d.results[index].EventDate;
                        endDateMod = data.d.results[index].EndDate;
                    } 

                    if (data.d.results[index].fRecurrence === true){
                        //console.log(data.d.results[index].Title)
                        events.push({
                            title: data.d.results[index].Title ,
                            id: data.d.results[index].ID,
                            _urlX: data.d.results[index].__metadata.uri,
                            _calListName : calListName,
                            start: startDateMod,
                            end: endDateMod,
                            allDay: data.d.results[index].fAllDayEvent,
                            recurr: data.d.results[index].fRecurrence,
                            recurrData: data.d.results[index].RecurrenceData,
                            rrule: parseRecurrentEvent(data.d.results[index].RecurrenceData, startDateMod, endDateMod)
                        });
                    }else{
                        events.push({
                            title: data.d.results[index].Title ,
                            id: data.d.results[index].ID,
                            _urlX: data.d.results[index].__metadata.uri,
                            _calListName : calListName,
                            start: startDateMod,
                            end: endDateMod,
                            allDay: data.d.results[index].fAllDayEvent,
                            recurr: data.d.results[index].fRecurrence,
                        });
                    }
                }
                
                //console.log(events)
                successCallback(events);
            });
        },
        updateEvent = function(id, url, startDate, endDate, deptArr, deptBg, deptFg){
            var sDate =  formateDate(startDate);
            var eDate =  formateDate(endDate);
            var siteUrl = url.substr(0, url.indexOf('/_api/'));
            var call = jQuery.ajax({
                url: siteUrl + "/_api/Web/Lists/getByTitle('Calendar')/Items(" + id + ")",
                type: "POST",
                data: JSON.stringify({
                    EventDate: sDate,
                    EndDate: eDate
                }),
                headers: {
                    Accept: "application/json;odata=nometadata",
                    "Content-Type": "application/json;odata=nometadata",
                    "X-RequestDigest": jQuery("#__REQUESTDIGEST").val(),
                    "IF-MATCH": "*",
                    "X-Http-Method": "PATCH"  
                }
            });
            call.done(function (data, textStatus, jqXHR) {
                alert("Update Successful");
                displayCalendars(calArr, deptArr, deptBg, deptFg);
            });
            call.fail(function (jqXHR, textStatus, errorThrown) {
                alert("Update Failed");
                displayCalendars(calArr, deptArr, deptBg, deptFg);
            });
        },
        createEvent = function(deptURL, calListName) {
            return function(info, successCallback, failureCallback){
                getCalsData(info, deptURL, calListName, successCallback, failureCallback);
            };
        },
        displayCalendars = function(calArr, deptArr, deptBg, deptFg){
            var calendarEl = document.getElementById('calendar');
            var eventSources = [], eventSrc = {},                 
                $calShowWeekend = $(mergedCal).attr('showWeekend'), calShowWeekend = $calShowWeekend !== undefined ? true : calOptions.showWeekend;
        
            for(var i=0; i<deptArr.length; i++){
                var deptURL = "/" + deptArr[i] + "/_api/Web/Lists/GetByTitle('"+calArr[i]+"')/items?$select=ID,Title,EventDate,EndDate,fAllDayEvent,fRecurrence,RecurrenceData&$top=1000";
                eventSrc = {
                    events: createEvent(deptURL, calArr[i]),
                    color: deptBg[i],   
                    textColor: deptFg[i] 
                };
                eventSources.push(eventSrc);
            }
            
        
            var calendar = new FullCalendar.Calendar(calendarEl, {
                //Plugins
                plugins: [ 'dayGrid', 'timeGrid', 'interaction', 'moment', 'rrule' ],
        
                // Calendar Options
                editable: false,
                timezone: "UTC",
                droppable: false,
                header:{
                    left: 'today,prev,next,title',
                    center:'',
                    right:''
                },
                weekends: calShowWeekend,
                eventTimeFormat: { 
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                    meridiem: false
                }, 
                displayEventTime:true,
                
                // Multiple Calendars resources
                eventSources: eventSources,

                //open up the display form when a user clicks on an event
                eventClick: function (info) {
                    var dispPath = info.event._def.extendedProps._urlX;
                    var calListName = info.event._def.extendedProps._calListName;
                    dispPath = dispPath.substr(0, dispPath.indexOf('_api/'));
                    
                    if ($('html').hasClass('access-write-ribbon')){
                        PDSB.UI.OpenResult('Edit Event Properties', dispPath + "Lists/"+ calListName +"/EditForm.aspx" + "?ID=" + info.event.id, true);
                    }else{
                        PDSB.UI.OpenResult('Event Properties', dispPath + "Lists/"+ calListName +"/DispForm.aspx" + "?ID=" + info.event.id, false);
                    }
                    
                },
                //update the end date when a user drags and drops an event 
                eventDrop: function(info) {
                    UpdateEvent(info.event.id, info.event._def.extendedProps._urlX, info.event.start, info.event.end, deptArr, deptBg, deptFg);
                },
                dateClick: function(info){
                    console.log("date clicked")
                    //$('#exampleModalCenter').modal('show');
                }
            });
            calendar.render();
        },
        init = function(){
            $(function(){
                displayDpd(calNames(), deptURLs(), deptNames());
                displayLegend(deptNames(), deptBg());
                displayCalendars(calNames(), deptURLs(), deptBg(), deptFg());
            })
        };

        init();

    return {
        NewEvent : newEvent,
        DpdChange : dpdChange,
        Init : init
    }
}());








