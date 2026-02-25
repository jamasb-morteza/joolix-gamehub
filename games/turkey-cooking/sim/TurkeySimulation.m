%for blog: take pictures of graphs of inside and outsite tempurature vs
%time and oven temperature, also temperature vs radius of a properly cooked turkey.

tic
init=0;
if init == 0
clear all
weight = 15/2.2;%lbs
density = 800;
% r0=.15;
r0 = (weight/density/4*3/pi)^(1/3);
deltar=r0/30;
r=[deltar*1:deltar:r0];

alpha = .412/2800/1000;
h=9; %nusselt number
k=.412+r*0;

% weight = r0^3*4*pi/3*density;

Tinf=600;
Ti=20;
T=Ti+r*0;
waterlost=r*0;
% T(end)=T(end)+1;
end

deltat = .1;
time=.6*60*60/deltat;%minutes
Tcenterlog=zeros(1,time);
Tlog=Tcenterlog;

for i = 1:time

    dTtemp = (T(3:end)-T(1:end-2))./(2*deltar); %only works if r is linear
    dTdr= [(T(2)-T(1))/deltar, dTtemp, (T(end)-T(end-1))/deltar];
%     dTdr = diff(T)./diff(r);
%     dTdr(end+1)=dTdr(end);
    dTdr(end)= h*(Tinf-T(end))/k(end);
    parenthesis=dTdr.*r.^2;
    dPtemp = (parenthesis(3:end)-parenthesis(1:end-2))./(2*deltar); %again, linear only
    dPdr = [(parenthesis(2)-parenthesis(1))/deltar, dPtemp, (parenthesis(end)-parenthesis(end-1))/deltar];
    
%     dPdr = diff(parenthesis)./diff(r);
%     dPdr(end+1) = dPdr(end);
    
    
% %     if kout > k(end)
% %         k(end)=(kout-k(end))/3+k(end);
% %     end
%     kout=h*(Tinf-T(end))/dTdr(end);
%     k(end)=kout;
    
    alpha = k/2800/density;
    
    dTdt=alpha.*dPdr./r.^2;
    
%     dTdt(1)=dTdt(1)/2;
    
    T=T+dTdt*deltat;
    waterlost=waterlost+(10.^((T-20)/80)-1)/10;
%     Tcenterlog(i)=T(1);
%     Tlog(i)=T(end);

end
figure(1)
plot(r,(T*1.8+32))

figure(2)
plot(r,waterlost)
% cooktime=[1:time]*deltat/3600;
% figure(2)
% hold on
% plot(cooktime,Tcenterlog*1.8+32)
% plot(cooktime,Tlog*1.8+32)
% toc